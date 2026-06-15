import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "ADMIN" ? user : null;
}

export async function GET() {
  const supabase = createSupabaseServiceClient();
  const { data: countries, error } = await supabase
    .from("shipping_countries")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: methods } = await supabase
    .from("shipping_country_methods")
    .select("*")
    .order("sort_order", { ascending: true });

  const result = (countries ?? []).map((c) => ({
    ...c,
    methods: (methods ?? []).filter((m) => m.country_id === c.id),
  }));
  return NextResponse.json({ countries: result });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { code, name } = await req.json();
  if (!code || !name) {
    return NextResponse.json({ error: "Podaj kod kraju i nazwę." }, { status: 400 });
  }
  const supabase = createSupabaseServiceClient();
  const { data: last } = await supabase
    .from("shipping_countries")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("shipping_countries")
    .insert({
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ country: data });
}
