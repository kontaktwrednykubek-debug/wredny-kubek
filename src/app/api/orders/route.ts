import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/orders — utworzenie zamówienia z koszyka.
 * Zwraca id pierwszego rekordu (jednego z pakietu zamówień użytkownika).
 */
const bodySchema = z.object({
  shipping: z.object({
    fullName: z.string().min(2).max(120),
    phone: z.string().min(6).max(40),
    address: z.string().min(3).max(200),
    city: z.string().min(2).max(80),
    zip: z.string().min(3).max(20),
  }),
  items: z
    .array(
      z.object({
        designId: z.string().uuid().nullable(),
        productId: z.string().min(1).max(120),
        quantity: z.number().int().min(1).max(999),
        unitPriceGr: z.number().int().min(0),
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

  const rows = items.map((it) => ({
    user_id: user.id,
    design_id: it.designId,
    product_id: it.productId,
    amount_grosze: it.unitPriceGr * it.quantity,
    quantity: it.quantity,
    shipping_info: shipping,
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
