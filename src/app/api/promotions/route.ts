import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ promotion: null }, { status: 200 });
  }

  return NextResponse.json({ promotion: data });
}
