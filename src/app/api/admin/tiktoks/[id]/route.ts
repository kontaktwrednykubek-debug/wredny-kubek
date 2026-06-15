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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const supabase = createSupabaseServiceClient();

  // Pola filmu które wolno zmieniać
  const allowed = ["is_active", "sort_order", "title"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("tiktoks").update(patch).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aktualizacja powiązanych produktów (jeśli przekazano product_slugs)
  if (Array.isArray(body.product_slugs)) {
    await supabase.from("tiktok_products").delete().eq("tiktok_id", params.id);
    const slugs: string[] = body.product_slugs.filter(Boolean);
    if (slugs.length > 0) {
      await supabase.from("tiktok_products").insert(
        slugs.map((slug, idx) => ({
          tiktok_id: params.id,
          product_slug: slug,
          sort_order: idx,
        })),
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = createSupabaseServiceClient();
  // tiktok_products usuwa się kaskadowo (ON DELETE CASCADE)
  const { error } = await supabase.from("tiktoks").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
