import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function isAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "ADMIN";
}

/** POST — dodaj/zmień próg (min sztuk → cena) dla metody zagranicznej */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const minQuantity = Math.max(1, Math.round(Number(body.min_quantity) || 1));
  const priceGrosze = Math.max(0, Math.round(Number(body.price_grosze) || 0));

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("shipping_country_method_tiers")
    .upsert(
      { method_id: params.id, min_quantity: minQuantity, price_grosze: priceGrosze },
      { onConflict: "method_id,min_quantity" },
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tier: data });
}
