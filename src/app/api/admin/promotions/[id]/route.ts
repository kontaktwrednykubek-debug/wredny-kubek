import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServiceClient();
  const body = await req.json();

  const allowed = ["active", "buy_qty", "get_qty", "label"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const { data, error } = await supabase
    .from("promotions")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ promotion: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
