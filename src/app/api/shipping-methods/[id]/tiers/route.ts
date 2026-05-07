import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const tierSchema = z.object({
  minQuantity: z.number().int().min(1).max(9999),
  priceGrosze: z.number().int().min(0).max(100000),
});

async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const, status: 401, supabase };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") {
    return { error: "forbidden" as const, status: 403, supabase };
  }
  return { error: null, supabase };
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const json = await req.json().catch(() => null);
  const parsed = tierSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { data, error } = await auth.supabase
    .from("shipping_method_tiers")
    .upsert(
      {
        shipping_method_id: params.id,
        min_quantity: parsed.data.minQuantity,
        price_grosze: parsed.data.priceGrosze,
      },
      { onConflict: "shipping_method_id,min_quantity" },
    )
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tier: data });
}
