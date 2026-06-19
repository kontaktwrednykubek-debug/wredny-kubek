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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; tierId: string } },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("shipping_country_method_tiers")
    .delete()
    .eq("id", params.tierId)
    .eq("method_id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
