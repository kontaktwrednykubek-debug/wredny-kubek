import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { validateDiscountCode } from "@/lib/discount/service";

export const runtime = "nodejs";

const bodySchema = z.object({
  code: z.string().min(1).max(40),
  itemsTotalGrosze: z.number().int().nonnegative(),
  shippingGrosze: z.number().int().nonnegative().optional(),
});

/**
 * POST /api/discount-codes/validate
 *
 * Waliduje kod rabatowy dla aktualnie zalogowanego użytkownika.
 * Używa service clienta (żeby ominąć RLS które blokuje czytanie discount_codes).
 */
export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const serviceSupabase = createSupabaseServiceClient();
  const result = await validateDiscountCode({
    supabase: serviceSupabase,
    code: parsed.data.code,
    userId: user.id,
    itemsTotalGrosze: parsed.data.itemsTotalGrosze,
    shippingGrosze: parsed.data.shippingGrosze ?? 0,
  });

  return NextResponse.json(result);
}
