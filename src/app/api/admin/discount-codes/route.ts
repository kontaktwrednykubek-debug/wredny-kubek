import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createStripeCoupon } from "@/lib/discount/service";

export const runtime = "nodejs";

const createSchema = z.object({
  code: z.string().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, "Tylko litery, cyfry, _ i -"),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().int().positive().nullable().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  min_order_grosze: z.number().int().nonnegative().nullable().optional(),
  one_per_user: z.boolean().optional(),
  active: z.boolean().optional(),
});

async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { supabase, user };
}

/** GET /api/admin/discount-codes — lista wszystkich kodów (admin). */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

/** POST /api/admin/discount-codes — utworzenie kodu + sync Stripe. */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Walidacja zależna od typu
  if (input.type === "percent" && (!input.value || input.value < 1 || input.value > 100)) {
    return NextResponse.json({ error: "Wartość procentowa musi być 1-100." }, { status: 400 });
  }
  if (input.type === "fixed" && (!input.value || input.value < 1)) {
    return NextResponse.json({ error: "Wartość kwotowa (grosze) musi być > 0." }, { status: 400 });
  }

  const codeUpper = input.code.toUpperCase();

  // Tworzenie Stripe Coupon + PromotionCode (nie dotyczy free_shipping)
  let stripeCouponId: string | null = null;
  let stripePromoId: string | null = null;
  if (input.type !== "free_shipping") {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe nie jest skonfigurowany." },
        { status: 503 },
      );
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    try {
      const r = await createStripeCoupon({
        stripe,
        type: input.type,
        value: input.value ?? null,
        code: codeUpper,
        validUntil: input.valid_until ?? null,
        maxRedemptions: input.max_uses ?? null,
      });
      stripeCouponId = r.couponId;
      stripePromoId = r.promotionCodeId;
    } catch (err) {
      console.error("[admin/discount-codes] Stripe coupon creation failed:", err);
      return NextResponse.json(
        { error: `Stripe: ${err instanceof Error ? err.message : "błąd"}` },
        { status: 500 },
      );
    }
  }

  const { data, error } = await auth.supabase
    .from("discount_codes")
    .insert({
      code: codeUpper,
      type: input.type,
      value: input.type === "free_shipping" ? null : input.value,
      valid_from: input.valid_from ?? new Date().toISOString(),
      valid_until: input.valid_until ?? null,
      max_uses: input.max_uses ?? null,
      min_order_grosze: input.min_order_grosze ?? null,
      one_per_user: input.one_per_user ?? false,
      active: input.active ?? true,
      stripe_coupon_id: stripeCouponId,
      stripe_promotion_code_id: stripePromoId,
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
