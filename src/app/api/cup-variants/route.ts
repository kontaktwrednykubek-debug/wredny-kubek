import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cup_color_variants")
    .select("id, name, image_url, sort_order, stock_count")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variants: data ?? [] });
}

const postSchema = z.object({
  name: z.string().min(1).max(80),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  stockCount: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { name, imageUrl, sortOrder, stockCount } = parsed.data;
  const { data, error } = await supabase
    .from("cup_color_variants")
    .insert({ name, image_url: imageUrl ?? null, sort_order: sortOrder ?? 100, stock_count: stockCount ?? 0 })
    .select("id, name, image_url, sort_order, stock_count")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variant: data }, { status: 201 });
}
