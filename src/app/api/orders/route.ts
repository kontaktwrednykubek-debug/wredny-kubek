import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { validateDiscountCode } from "@/lib/discount/service";

const bodySchema = z.object({
  shipping: z.object({
    fullName: z.string().min(2).max(120),
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
      .max(10)
      .refine(
        (val) => /^\d{2}-\d{3}$/.test(val) || /^\d{3,6}$/.test(val),
        "Kod pocztowy w formacie 00-000 (PL) lub 1234 (międzynarodowy)"
      ),
    shippingMethod: z.string().min(2).max(50),
    parcelCode: z.string().max(40).optional(),
    note: z.string().max(500).optional(),
  }),
  items: z
    .array(
      z.object({
        designId: z.string().uuid().nullable(),
        productId: z.string().min(1).max(120),
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
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { shipping, items, discountCode } = parsed.data;

  // Walidacja metody dostawy z bazy.
  const { data: methodRow } = await supabase
    .from("shipping_methods")
    .select(
      "code, name, price_grosze, requires_parcel_code, carrier, is_active",
    )
    .eq("code", shipping.shippingMethod)
    .maybeSingle();

  if (!methodRow || !methodRow.is_active) {
    return NextResponse.json(
      { error: "Nieznana lub nieaktywna metoda dostawy." },
      { status: 400 },
    );
  }
  if (methodRow.requires_parcel_code && !shipping.parcelCode?.trim()) {
    return NextResponse.json(
      { error: "Wymagany kod paczkomatu / punktu odbioru." },
      { status: 400 },
    );
  }

  const normalizedShipping = {
    ...shipping,
    phone: normalizePhone(shipping.phone),
    shippingMethodName: methodRow.name,
    shippingPriceGr: methodRow.price_grosze,
    shippingCarrier: methodRow.carrier ?? null,
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
      userId: user.id,
      itemsTotalGrosze,
      shippingGrosze: methodRow.price_grosze ?? 0,
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

  const rows = items.map((it, idx) => ({
    user_id: user.id,
    design_id: it.designId,
    product_id: it.productId,
    amount_grosze: it.unitPriceGr * it.quantity,
    quantity: it.quantity,
    preview_url: it.previewUrl ?? null,
    shipping_info: normalizedShipping,
    shipping_carrier: methodRow.carrier ?? null,
    status: "PENDING" as const,
    // Rabat zapisujemy tylko na pierwszym wierszu — będziemy go stosować do
    // całej sesji Stripe (jednej transakcji).
    discount_code_id: idx === 0 ? discountCodeId : null,
    discount_grosze: idx === 0 ? discountGrosze : 0,
  }));

  const { data, error } = await supabase
    .from("orders")
    .insert(rows)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const firstOrderId = data?.[0]?.id as string | undefined;

  // UWAGA: email potwierdzający NIE jest wysyłany tutaj — dopiero po
  // potwierdzeniu płatności przez Stripe webhook (checkout.session.completed).
  return NextResponse.json({ orderId: firstOrderId, count: data?.length ?? 0 });
}
