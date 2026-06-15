import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

/**
 * GET /api/mystery-mug — publiczna konfiguracja upsellu "Kubek w ciemno".
 */
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mystery_mug_config")
    .select("id, enabled, price_grosze, label, description, image_url")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ config: null });
  return NextResponse.json({ config: data });
}
