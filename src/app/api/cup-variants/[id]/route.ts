import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

async function requireAdmin(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return p?.role === "ADMIN";
}

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  stockCount: z.number().int().min(0).optional(),
  priceGrosze: z.number().int().min(0).max(1000000).nullable().optional(),
  materials: z.array(z.string().min(1).max(60)).max(20).optional(),
  extraInfo: z.array(z.string().min(1).max(80)).max(20).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  if (!(await requireAdmin(supabase))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.imageUrl !== undefined) patch.image_url = parsed.data.imageUrl;
  if (parsed.data.sortOrder !== undefined) patch.sort_order = parsed.data.sortOrder;
  if (parsed.data.stockCount !== undefined) patch.stock_count = parsed.data.stockCount;
  if (parsed.data.priceGrosze !== undefined) patch.price_grosze = parsed.data.priceGrosze;
  if (parsed.data.materials !== undefined) patch.materials = parsed.data.materials;
  if (parsed.data.extraInfo !== undefined) patch.extra_info = parsed.data.extraInfo;

  const { data, error } = await supabase
    .from("cup_color_variants")
    .update(patch)
    .eq("id", params.id)
    .select("id, name, image_url, sort_order, stock_count, price_grosze, materials, extra_info")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variant: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  if (!(await requireAdmin(supabase))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await supabase.from("cup_color_variants").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
