import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { validateDiscountCode } from "@/lib/discount/service";

const bodySchema = z.object({
  shipping: z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z
      .string()
      .min(6)
      .max(40)
      .refine(isValidPhone, {
        message: "Nieprawidłowy numer telefonu.",
      }),
    address: z.string().min(3).max(200),
    city: z.string().min(2).max(80),
    zip: z
      .string()
      .min(3)
      .max(12)
      // PL: 00-000, lub kody zagraniczne (cyfry/litery/spacja/myślnik)
      .refine(
        (val) => /^[A-Za-z0-9][A-Za-z0-9 -]{1,10}$/.test(val),
        "Nieprawidłowy kod pocztowy",
      ),
    shippingMethod: z.string().min(2).max(80),
    parcelCode: z.string().max(250).optional(),
    country: z.string().max(80).optional(),
    pickupPoint: z
      .object({
        name: z.string().max(120),
        street: z.string().max(120),
        house: z.string().max(40),
        apt: z.string().max(40).optional(),
        zip: z.string().max(20),
        city: z.string().max(80),
      })
      .optional(),
    note: z.string().max(500).optional(),
  }),
  items: z
    .array(
      z.object({
        designId: z.string().uuid().nullable(),
        productId: z.string().min(1).max(120),
        label: z.string().max(300).optional(),
        variantColor: z.string().max(100).optional(),
        variantOptional: z.boolean().optional(),
        quantity: z.number().int().min(1).max(999),
        unitPriceGr: z.number().int().min(0),
        previewUrl: z.string().url().optional().nullable(),
      }),
    )
    .min(1)
    .max(50),
  discountCode: z.string().max(40).nullable().optional(),
});

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // user może być null — dozwolony guest checkout

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { shipping, items, discountCode } = parsed.data;
  
  console.log("[orders-api] Request items:", items.map(i => ({
    productId: i.productId,
    variantColor: i.variantColor,
    quantity: i.quantity,
    label: i.label
  })));

  // Server-side validation: produkt sklepowy Z wariantami musi mieć variantColor.
  // Produkt bez wariantów (variantOptional) jest poprawny bez koloru.
  for (const item of items) {
    if (item.productId.startsWith("shop:") && !item.variantColor && !item.variantOptional) {
      console.error("[orders-api] Shop product without variantColor:", item);
      return NextResponse.json(
        {
          error: `Produkt "${item.label}" wymaga wyboru wariantu koloru. Usuń go z koszyka i dodaj ponownie.`,
          code: "MISSING_VARIANT",
          productId: item.productId,
        },
        { status: 400 }
      );
    }
  }

  // Walidacja dostępności (BEZ zdejmowania stanu). Stan magazynowy schodzi
  // dopiero po POTWIERDZENIU płatności (webhook / /verify → decrementStockForPaidOrders),
  // żeby porzucona/nieopłacona płatność nie blokowała sztuki w sklepie. Tu tylko
  // sprawdzamy, czy w chwili składania zamówienia jest wystarczający stan — dzięki
  // temu produkt już wyprzedany od razu daje komunikat „sprzedane".
  const stockService = createSupabaseServiceClient();

  // Kolory — wspólny globalny stan per wariant (cup_color_variants.stock_count).
  const qtyByVariant = new Map<string, number>();
  for (const item of items) {
    if (!item.productId.startsWith("shop:") || !item.variantColor) continue;
    qtyByVariant.set(
      item.variantColor,
      (qtyByVariant.get(item.variantColor) ?? 0) + item.quantity,
    );
  }

  for (const [variantId, qty] of qtyByVariant) {
    const { data: row, error: readErr } = await stockService
      .from("cup_color_variants")
      .select("stock_count, name")
      .eq("id", variantId)
      .maybeSingle();

    if (readErr || !row) {
      return NextResponse.json(
        { error: "Nie znaleziono wariantu koloru.", code: "OUT_OF_STOCK" },
        { status: 400 },
      );
    }

    const available = row.stock_count ?? 0;
    const name = row.name ?? variantId;

    if (available < qty) {
      return NextResponse.json(
        {
          error:
            available === 0
              ? `Wariant „${name}" właśnie został wyprzedany — ktoś Cię ubiegł.`
              : `Produktu w wariancie "${name}" pozostało tylko ${available} szt.`,
          code: "OUT_OF_STOCK",
          available,
          requested: qty,
        },
        { status: 400 },
      );
    }
  }

  // Produkty BEZ wariantu koloru — stan bazowy w specs["Ilość"].
  // Brak/niepoprawny „Ilość" = brak limitu (pomijamy).
  const qtyBySlug = new Map<string, { qty: number; label: string }>();
  for (const item of items) {
    if (!item.productId.startsWith("shop:") || item.variantColor) continue;
    const slug = item.productId.slice("shop:".length);
    const prev = qtyBySlug.get(slug);
    qtyBySlug.set(slug, {
      qty: (prev?.qty ?? 0) + item.quantity,
      label: prev?.label ?? item.label ?? slug,
    });
  }

  for (const [slug, { qty, label }] of qtyBySlug) {
    const { data: row, error: readErr } = await stockService
      .from("shop_products")
      .select("specs")
      .eq("slug", slug)
      .maybeSingle();

    if (readErr || !row) {
      return NextResponse.json(
        { error: "Nie znaleziono produktu.", code: "OUT_OF_STOCK", label },
        { status: 400 },
      );
    }

    const specs = (row.specs as Record<string, string> | null) ?? {};
    const parsed = parseInt(specs["Ilość"] ?? "", 10);

    if (Number.isFinite(parsed) && parsed < qty) {
      return NextResponse.json(
        {
          error:
            parsed === 0
              ? `„${label}" właśnie został sprzedany — ktoś Cię ubiegł.`
              : `Produktu „${label}" pozostało tylko ${parsed} szt.`,
          code: "OUT_OF_STOCK",
          label,
          available: parsed,
          requested: qty,
        },
        { status: 400 },
      );
    }
  }

  const totalQty = items.reduce((s, it) => s + it.quantity, 0);

  let shippingMethodName: string;
  let shippingPriceGr: number;
  let shippingCarrier: string | null;
  let requiresParcel: boolean;

  if (shipping.shippingMethod.startsWith("intl:")) {
    // ---- PRZESYŁKA ZAGRANICZNA ----
    const methodId = shipping.shippingMethod.slice("intl:".length);
    const { data: intlMethod } = await supabase
      .from("shipping_country_methods")
      .select("id, name, carrier, price_grosze, requires_parcel_code, is_active, shipping_countries(name), shipping_country_method_tiers(min_quantity, price_grosze)")
      .eq("id", methodId)
      .maybeSingle();

    if (!intlMethod || !intlMethod.is_active) {
      return NextResponse.json(
        { error: "Nieznana lub nieaktywna metoda dostawy zagranicznej." },
        { status: 400 },
      );
    }
    const countryName =
      (intlMethod.shipping_countries as { name?: string } | null)?.name ?? shipping.country ?? "";
    shippingMethodName = countryName ? `${intlMethod.name} (${countryName})` : intlMethod.name;
    // Cena wg progów liczby sztuk (fallback: cena bazowa)
    const iTiers = (intlMethod.shipping_country_method_tiers as { min_quantity: number; price_grosze: number }[]) ?? [];
    let iPrice = intlMethod.price_grosze ?? 0;
    if (iTiers.length > 0) {
      const sorted = [...iTiers].sort((a, b) => b.min_quantity - a.min_quantity);
      const tier = sorted.find((t) => t.min_quantity <= totalQty);
      if (tier) iPrice = tier.price_grosze;
    }
    shippingPriceGr = iPrice;
    shippingCarrier = (intlMethod.carrier as string | null) ?? null;
    requiresParcel = Boolean(intlMethod.requires_parcel_code);
  } else {
    // ---- DOSTAWA KRAJOWA (Polska) ----
    const { data: methodRow } = await supabase
      .from("shipping_methods")
      .select(
        "id, code, name, price_grosze, requires_parcel_code, carrier, is_active, shipping_method_tiers(min_quantity, price_grosze)",
      )
      .eq("code", shipping.shippingMethod)
      .maybeSingle();

    if (!methodRow || !methodRow.is_active) {
      return NextResponse.json(
        { error: "Nieznana lub nieaktywna metoda dostawy." },
        { status: 400 },
      );
    }

    // Cena wg tierów (lub płaska cena jako fallback).
    const tiers = (methodRow.shipping_method_tiers as { min_quantity: number; price_grosze: number }[]) ?? [];
    let price = methodRow.price_grosze;
    if (tiers.length > 0) {
      const sorted = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity);
      const tier = sorted.find((t) => t.min_quantity <= totalQty);
      if (tier) price = tier.price_grosze;
    }
    shippingMethodName = methodRow.name;
    shippingPriceGr = price;
    shippingCarrier = (methodRow.carrier as string | null) ?? null;
    requiresParcel = Boolean(methodRow.requires_parcel_code);
  }

  if (requiresParcel && !shipping.parcelCode?.trim()) {
    return NextResponse.json(
      { error: "Wymagany kod paczkomatu / punktu odbioru." },
      { status: 400 },
    );
  }

  const normalizedShipping = {
    ...shipping,
    phone: normalizePhone(shipping.phone),
    shippingMethodName,
    shippingPriceGr,
    shippingCarrier,
  };

  // Walidacja kodu rabatowego (jeśli podany) — serwer musi ponownie go sprawdzić
  // (klient może być skompromitowany).
  let discountCodeId: string | null = null;
  let discountGrosze = 0;
  if (discountCode) {
    const itemsTotalGrosze = items.reduce((s, it) => s + it.unitPriceGr * it.quantity, 0);
    const service = createSupabaseServiceClient();
    const v = await validateDiscountCode({
      supabase: service,
      code: discountCode,
      userId: user?.id ?? null,
      itemsTotalGrosze,
      shippingGrosze: shippingPriceGr,
    });
    if (!v.valid || !v.code) {
      return NextResponse.json(
        { error: v.error ?? "Nieprawid\u0142owy kod rabatowy." },
        { status: 400 },
      );
    }
    discountCodeId = v.code.id;
    discountGrosze = v.discountGrosze;
  }

  // Wspólny group_id dla wszystkich pozycji z jednego koszyka — panel admina
  // wyświetla je jako JEDNO zamówienie z wieloma pozycjami.
  const groupId = crypto.randomUUID();

  const rows = items.map((it, idx) => ({
    user_id: user?.id ?? null,
    group_id: groupId,
    design_id: it.designId,
    product_id: it.productId,
    label: it.label ?? null,
    variant_color: it.variantColor ?? null,
    amount_grosze: it.unitPriceGr * it.quantity,
    quantity: it.quantity,
    preview_url: it.previewUrl ?? null,
    shipping_info: normalizedShipping,
    shipping_carrier: shippingCarrier,
    status: "PENDING" as const,
    // Rabat zapisujemy tylko na pierwszym wierszu — będziemy go stosować do
    // całej sesji Stripe (jednej transakcji).
    discount_code_id: idx === 0 ? discountCodeId : null,
    discount_grosze: idx === 0 ? discountGrosze : 0,
  }));

  // Goście nie mają sesji — musimy użyć service clienta, by ominąć RLS
  const dbClient = user ? supabase : createSupabaseServiceClient();
  const { data, error } = await dbClient
    .from("orders")
    .insert(rows)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const firstOrderId = data?.[0]?.id as string | undefined;

  // UWAGA: email potwierdzający NIE jest wysyłany tutaj — dopiero po
  // potwierdzeniu płatności przez Stripe webhook (checkout.session.completed).
  const orderIds = (data ?? []).map((d) => d.id as string);
  return NextResponse.json({ orderId: firstOrderId, orderIds, count: orderIds.length });
}
