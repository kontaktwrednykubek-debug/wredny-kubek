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

/** POST /api/admin/shipping-countries/[id]/methods — dodaj metodę wysyłki do kraju */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Podaj nazwę metody." }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { data: last } = await supabase
    .from("shipping_country_methods")
    .select("sort_order")
    .eq("country_id", params.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("shipping_country_methods")
    .insert({
      country_id: params.id,
      name: String(body.name).trim(),
      carrier: body.carrier ?? null,
      price_grosze: Math.max(0, Math.round(Number(body.price_grosze) || 0)),
      requires_parcel_code: Boolean(body.requires_parcel_code),
      free_shipping_threshold_grosze: body.free_shipping_threshold_grosze ?? null,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ method: data });
}
