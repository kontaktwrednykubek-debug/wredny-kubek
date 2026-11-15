import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiscountCartItem, DiscountCode, DiscountValidationResult, DiscountType } from "./types";

/**
 * Waliduje kod rabatowy dla danego użytkownika i sumy koszyka.
 *
 * @param supabase klient Supabase (może być zwykły — zapytanie do `discount_codes`
 *                działa jeśli user jest adminem lub użyjemy service clienta).
 *                Dla bezpieczeństwa wywołuj z kontekstu API z service clientem.
 */
export async function validateDiscountCode(params: {
  supabase: SupabaseClient;
  code: string;
  userId: string | null;
  itemsTotalGrosze: number;
  shippingGrosze: number;
  /** Pozycje koszyka — wymagane dla rabatów „na drugą sztukę". */
  items?: DiscountCartItem[];
  /** E-mail klienta (gość) — do rozpoznania własnej rezerwacji zdrapki. */
  email?: string | null;
}): Promise<DiscountValidationResult> {
  const code = params.code.trim().toUpperCase();
  if (!code) return { valid: false, error: "Podaj kod rabatowy.", discountGrosze: 0 };

  // Klient może wpisać kod z myślnikami, bez nich lub ze spacjami
  // (np. „ZDR-K7XM-Q4PA", „ZDRK7XMQ4PA", „zdr k7xm q4pa") — sprawdzamy warianty.
  const candidates = codeCandidates(code);
  const { data: rows, error } = await params.supabase
    .from("discount_codes")
    .select("*")
    .in("code", candidates);

  const found = (rows ?? []) as DiscountCode[];
  const dc =
    candidates.map((c) => found.find((r) => r.code === c)).find(Boolean) ?? null;
  if (error || !dc) {
    return { valid: false, error: "Kod nie istnieje.", discountGrosze: 0 };
  }

  if (!dc.active) {
    return { valid: false, error: "Kod jest nieaktywny.", discountGrosze: 0 };
  }

  const now = new Date();
  if (new Date(dc.valid_from) > now) {
    return { valid: false, error: "Kod nie jest jeszcze ważny.", discountGrosze: 0 };
  }
  if (dc.valid_until && new Date(dc.valid_until) < now) {
    return { valid: false, error: "Kod wygasł.", discountGrosze: 0 };
  }

  if (dc.max_uses != null && dc.times_used >= dc.max_uses) {
    return {
      valid: false,
      error: dc.scratch_batch_id
        ? "Ten kod ze zdrapki został już wykorzystany."
        : "Kod został już w pełni wykorzystany.",
      discountGrosze: 0,
    };
  }

  // Zdrapka zablokowana przez inne, trwające właśnie zamówienie.
  if (
    dc.scratch_batch_id &&
    dc.reserved_until &&
    new Date(dc.reserved_until) > now &&
    (!params.userId || dc.reserved_by !== params.userId.toLowerCase()) &&
    (!params.email || dc.reserved_by !== params.email.trim().toLowerCase())
  ) {
    return {
      valid: false,
      error: "Ten kod ze zdrapki jest już wykorzystywany w innym zamówieniu.",
      discountGrosze: 0,
    };
  }

  if (dc.min_order_grosze && params.itemsTotalGrosze < dc.min_order_grosze) {
    const minPln = (dc.min_order_grosze / 100).toFixed(2);
    return {
      valid: false,
      error: `Minimalna wartość zamówienia dla tego kodu to ${minPln} zł.`,
      discountGrosze: 0,
    };
  }

  if (dc.one_per_user && params.userId) {
    // Sprawdzenie tylko dla zalogowanych — dla gości nie mamy stabilnego identyfikatora.
    const { count } = await params.supabase
      .from("discount_code_uses")
      .select("*", { count: "exact", head: true })
      .eq("discount_code_id", dc.id)
      .eq("user_id", params.userId);
    if ((count ?? 0) > 0) {
      return {
        valid: false,
        error: "Ten kod został już przez Ciebie wykorzystany.",
        discountGrosze: 0,
      };
    }
  }

  // Rabat % / zł „od drugiego kubka" wymaga min. 2 płatnych kubków w koszyku
  // (gratisy 0 zł się nie liczą). Gratis i darmowa dostawa działają od 1 kubka.
  const paidUnits = paidUnitPrices(params.items).length;
  if (isSecondItemType(dc.type) && paidUnits < 2) {
    const missing = 2 - paidUnits;
    return {
      valid: false,
      error: `Aby wykorzystać ten kod, w koszyku muszą być minimum 2 kubki — dodaj jeszcze ${missing} ${
        missing === 1 ? "kubek" : "kubki"
      }.`,
      discountGrosze: 0,
    };
  }

  const discountGrosze = calculateDiscountGrosze(dc.type, dc.value, {
    itemsTotal: params.itemsTotalGrosze,
    shipping: params.shippingGrosze,
    items: params.items,
  });

  return {
    valid: true,
    code: {
      id: dc.id,
      code: dc.code,
      type: dc.type,
      value: dc.value,
      stripe_promotion_code_id: dc.stripe_promotion_code_id,
      gift_description: dc.gift_description ?? null,
      is_scratch: Boolean(dc.scratch_batch_id),
    },
    discountGrosze,
  };
}

/**
 * Oblicza wartość rabatu w groszach dla danego typu i sumy.
 * Zwraca wartość ≤ sumy (nie zjedzie poniżej 0).
 */
/**
 * Warianty zapisu kodu do wyszukania w bazie: dokładnie jak wpisany, bez
 * separatorów oraz w formacie zdrapki [PREFIKS-]XXXX-XXXX.
 */
export function codeCandidates(input: string): string[] {
  const raw = input.trim().toUpperCase();
  const bare = raw.replace(/[^A-Z0-9]/g, "");
  const out = [raw, raw.replace(/\s+/g, ""), bare];
  if (bare.length >= 8) {
    const tail = `${bare.slice(-8, -4)}-${bare.slice(-4)}`;
    const prefix = bare.slice(0, -8);
    out.push(prefix ? `${prefix}-${tail}` : tail);
  }
  return Array.from(new Set(out.filter(Boolean)));
}

export function isSecondItemType(type: DiscountType): boolean {
  return type === "second_percent" || type === "second_fixed";
}

/** Ceny jednostkowe wszystkich płatnych sztuk (gratisy 0 zł pomijamy). */
function paidUnitPrices(items: DiscountCartItem[] | undefined): number[] {
  const out: number[] = [];
  for (const it of items ?? []) {
    if (it.unitPriceGr <= 0) continue;
    for (let i = 0; i < it.quantity && out.length < 1000; i++) out.push(it.unitPriceGr);
  }
  return out;
}

export function calculateDiscountGrosze(
  type: DiscountType,
  value: number | null,
  totals: { itemsTotal: number; shipping: number; items?: DiscountCartItem[] },
): number {
  switch (type) {
    case "percent": {
      const pct = Math.max(1, Math.min(100, value ?? 0));
      return Math.round((totals.itemsTotal * pct) / 100);
    }
    case "fixed": {
      return Math.min(totals.itemsTotal, Math.max(0, value ?? 0));
    }
    case "free_shipping":
      return totals.shipping;
    case "second_percent":
    case "second_fixed": {
      // Rabat obejmuje tylko JEDNĄ sztukę (najtańszą), niezależnie od liczby sztuk.
      const prices = paidUnitPrices(totals.items);
      if (prices.length < 2) return 0;
      const cheapest = Math.min(...prices);
      if (type === "second_percent") {
        const pct = Math.max(1, Math.min(100, value ?? 0));
        return Math.round((cheapest * pct) / 100);
      }
      return Math.min(cheapest, Math.max(0, value ?? 0));
    }
    case "gift":
      return 0;
    default:
      return 0;
  }
}

/**
 * Tworzy w Stripe Coupon + PromotionCode powiązane z kodem w naszej bazie.
 * Zwraca ids do zapisania.
 *
 * Uwaga: `free_shipping` nie ma odpowiednika w Stripe Coupon — dla tego typu
 * nie tworzymy Coupona, a logikę zeroowania dostawy realizujemy w
 * /api/checkout/session (nie dodajemy line_item dostawy).
 */
export async function createStripeCoupon(params: {
  stripe: Stripe;
  type: DiscountType;
  value: number | null;
  code: string;
  validUntil: string | null;
  maxRedemptions: number | null;
}): Promise<{ couponId: string | null; promotionCodeId: string | null }> {
  if (params.type !== "percent" && params.type !== "fixed") {
    return { couponId: null, promotionCodeId: null };
  }

  const couponParams: Stripe.CouponCreateParams = {
    duration: "forever",
    name: params.code,
  };
  if (params.type === "percent") {
    couponParams.percent_off = params.value ?? 0;
  } else if (params.type === "fixed") {
    couponParams.amount_off = params.value ?? 0;
    couponParams.currency = "pln";
  }
  if (params.maxRedemptions) {
    couponParams.max_redemptions = params.maxRedemptions;
  }
  if (params.validUntil) {
    couponParams.redeem_by = Math.floor(new Date(params.validUntil).getTime() / 1000);
  }

  const coupon = await params.stripe.coupons.create(couponParams);

  const promoParams: Stripe.PromotionCodeCreateParams = {
    coupon: coupon.id,
    code: params.code,
  };
  if (params.validUntil) {
    promoParams.expires_at = Math.floor(new Date(params.validUntil).getTime() / 1000);
  }
  if (params.maxRedemptions) {
    promoParams.max_redemptions = params.maxRedemptions;
  }

  const promo = await params.stripe.promotionCodes.create(promoParams);

  return { couponId: coupon.id, promotionCodeId: promo.id };
}

/**
 * Usuwa (deaktywuje) Coupon w Stripe. Stripe nie pozwala "usunąć" w pełni
 * — deaktywujemy PromotionCode i usuwamy Coupon.
 */
export async function deleteStripeCoupon(params: {
  stripe: Stripe;
  couponId: string | null;
  promotionCodeId: string | null;
}): Promise<void> {
  try {
    if (params.promotionCodeId) {
      await params.stripe.promotionCodes.update(params.promotionCodeId, {
        active: false,
      });
    }
    if (params.couponId) {
      await params.stripe.coupons.del(params.couponId);
    }
  } catch (err) {
    console.warn("[discount] deleteStripeCoupon failed (non-fatal):", err);
  }
}
