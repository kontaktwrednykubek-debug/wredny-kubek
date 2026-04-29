import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";

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
      .regex(/^\d{2}-\d{3}$/, "Kod pocztowy w formacie 00-000"),
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

  const { shipping, items } = parsed.data;

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

  const rows = items.map((it) => ({
    user_id: user.id,
    design_id: it.designId,
    product_id: it.productId,
    amount_grosze: it.unitPriceGr * it.quantity,
    quantity: it.quantity,
    preview_url: it.previewUrl ?? null,
    shipping_info: normalizedShipping,
    shipping_carrier: methodRow.carrier ?? null,
    status: "PENDING" as const,
  }));

  const { data, error } = await supabase
    .from("orders")
    .insert(rows)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orderId: data?.[0]?.id, count: data?.length ?? 0 });
}
