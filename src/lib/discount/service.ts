import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiscountCode, DiscountValidationResult, DiscountType } from "./types";

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
  userId: string;
  itemsTotalGrosze: number;
  shippingGrosze: number;
}): Promise<DiscountValidationResult> {
  const code = params.code.trim().toUpperCase();
  if (!code) return { valid: false, error: "Podaj kod rabatowy.", discountGrosze: 0 };

  const { data: row, error } = await params.supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !row) {
    return { valid: false, error: "Kod nie istnieje.", discountGrosze: 0 };
  }
  const dc = row as DiscountCode;

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
    return { valid: false, error: "Kod został już w pełni wykorzystany.", discountGrosze: 0 };
  }

  if (dc.min_order_grosze && params.itemsTotalGrosze < dc.min_order_grosze) {
    const minPln = (dc.min_order_grosze / 100).toFixed(2);
    return {
      valid: false,
      error: `Minimalna wartość zamówienia dla tego kodu to ${minPln} zł.`,
      discountGrosze: 0,
    };
  }

  if (dc.one_per_user) {
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

  const discountGrosze = calculateDiscountGrosze(dc.type, dc.value, {
    itemsTotal: params.itemsTotalGrosze,
    shipping: params.shippingGrosze,
  });

  return {
    valid: true,
    code: {
      id: dc.id,
      code: dc.code,
      type: dc.type,
      value: dc.value,
      stripe_promotion_code_id: dc.stripe_promotion_code_id,
    },
    discountGrosze,
  };
}

/**
 * Oblicza wartość rabatu w groszach dla danego typu i sumy.
 * Zwraca wartość ≤ sumy (nie zjedzie poniżej 0).
 */
export function calculateDiscountGrosze(
  type: DiscountType,
  value: number | null,
  totals: { itemsTotal: number; shipping: number },
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
  if (params.type === "free_shipping") {
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
