import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteStripeCoupon } from "@/lib/discount/service";

export const runtime = "nodejs";

const patchSchema = z.object({
  active: z.boolean().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  min_order_grosze: z.number().int().nonnegative().nullable().optional(),
  one_per_user: z.boolean().optional(),
});

async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { supabase };
}

/** PATCH /api/admin/discount-codes/[id] — edycja wybranych pól (aktywny, daty, limity). */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("discount_codes")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

/** DELETE /api/admin/discount-codes/[id] — usuń kod (i związany Stripe Coupon). */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  // Pobierz kod by znaleźć Stripe ids
  const { data: code } = await auth.supabase
    .from("discount_codes")
    .select("stripe_coupon_id, stripe_promotion_code_id")
    .eq("id", params.id)
    .maybeSingle();

  if (code && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await deleteStripeCoupon({
      stripe,
      couponId: code.stripe_coupon_id,
      promotionCodeId: code.stripe_promotion_code_id,
    });
  }

  const { error } = await auth.supabase
    .from("discount_codes")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
