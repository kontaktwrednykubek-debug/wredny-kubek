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
  if (profile?.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("mystery_mug_config")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const supabase = createSupabaseServiceClient();

  // Znajdź istniejący rekord (lub utwórz gdy brak)
  const { data: existing } = await supabase
    .from("mystery_mug_config")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const allowed = ["enabled", "price_grosze", "label", "description", "image_url"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];

  if (!existing) {
    const { data, error } = await supabase
      .from("mystery_mug_config")
      .insert(patch)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ config: data });
  }

  const { data, error } = await supabase
    .from("mystery_mug_config")
    .update(patch)
    .eq("id", existing.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}
