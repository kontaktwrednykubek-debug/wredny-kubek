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

  // Server-side validation: shop products must have variantColor
  for (const item of items) {
    if (item.productId.startsWith("shop:") && !item.variantColor) {
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

  // Atomowa walidacja i rezerwacja stanu magazynowego (zapobieganie race conditions)
  for (const item of items) {
    if (!item.productId.startsWith("shop:")) {
      console.log(`[orders-api] Skipping non-shop product: ${item.productId}`);
      continue;
    }
    const slug = item.productId.slice("shop:".length);
    if (!item.variantColor) {
      console.log(`[orders-api] Skipping item without variantColor: ${item.productId}`);
      continue;
    }
    
    console.log(`[orders-api] Processing stock reservation for ${slug}, variant: ${item.variantColor}, qty: ${item.quantity}`);
    
    // Użyj atomowej operacji UPDATE z warunkiem, aby zarezerwować sztuki
    console.log(`[orders-api] Calling RPC reserve_variant_stock with params:`, {
      p_slug: slug,
      p_variant_id: item.variantColor,
      p_quantity: item.quantity,
    });
    
    const { data: rpcResult, error: updateError } = await supabase.rpc(
      "reserve_variant_stock",
      {
        p_slug: slug,
        p_variant_id: item.variantColor,
        p_quantity: item.quantity,
      }
    );
    
    console.log(`[orders-api] RPC response:`, { data: rpcResult, error: updateError });
    
    if (updateError) {
      console.error(`[orders-api] Stock reservation failed for ${slug}:`, updateError);
      return NextResponse.json(
        { 
          error: `Produktu w wariancie "${item.variantColor}" nie ma wystarczającej ilości.`,
          code: "OUT_OF_STOCK",
          details: updateError.message,
        },
        { status: 400 }
      );
    }
    
    // RPC zwraca tablicę z {success, new_stock, available}
    const result = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    const success = result?.success === true;
    const available = result?.available ?? 0;
    
    console.log(`[orders-api] Reservation result:`, { success, available, requested: item.quantity });
    
    if (!success) {
      return NextResponse.json(
        { 
          error: `Produktu w wariancie "${item.variantColor}" pozostało tylko ${available} szt.`,
          code: "OUT_OF_STOCK",
          available,
          requested: item.quantity,
        },
        { status: 400 }
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
