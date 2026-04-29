import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

/**
 * GET /api/me/admin-url
 * Zwraca tajny URL panelu administratora — TYLKO dla zalogowanych adminów.
 * Wszyscy inni dostają 404 (żadnego ujawnienia istnienia panelu).
 */
export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") return new NextResponse(null, { status: 404 });

  return NextResponse.json({ url: `/${env.ADMIN_URL_SECRET}` });
}
