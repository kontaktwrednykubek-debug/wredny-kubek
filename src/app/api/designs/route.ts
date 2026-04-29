import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/designs — zapis nowego projektu (lub aktualizacja).
 * GET  /api/designs — lista projektów zalogowanego użytkownika.
 */

const bodySchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.enum(["mug", "tshirt", "notebook", "keychain"]),
  data: z.object({
    elements: z.array(z.any()),
    mirror: z.boolean().optional(),
  }),
  previewUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, productId, data, previewUrl } = parsed.data;

  if (id) {
    const { data: row, error } = await supabase
      .from("designs")
      .update({
        product_id: productId,
        data,
        preview_url: previewUrl,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ design: row });
  }

  const { data: row, error } = await supabase
    .from("designs")
    .insert({
      user_id: user.id,
      product_id: productId,
      data,
      preview_url: previewUrl,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ design: row });
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("designs")
    .select("id, product_id, data, preview_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ designs: data });
}
