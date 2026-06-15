import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const revalidate = 0;

export async function GET() {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promotions: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = createSupabaseServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("promotions")
    .insert({
      active: body.active ?? false,
      buy_qty: body.buy_qty ?? 3,
      get_qty: body.get_qty ?? 1,
      label: body.label ?? "Kup X, dostaniesz Y gratis!",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ promotion: data }, { status: 201 });
}
