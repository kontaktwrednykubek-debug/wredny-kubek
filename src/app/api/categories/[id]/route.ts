import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  longDescription: z.string().max(10000).optional(),
  metaDescription: z.string().max(160).optional(),
  parentId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().url("").or(z.literal("")).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99999).optional(),
  isVisible: z.boolean().optional(),
});

async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const, status: 401, supabase };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") {
    return { error: "forbidden" as const, status: 403, supabase };
  }
  return { error: null, supabase };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const p = parsed.data;
  const update: Record<string, unknown> = {};
  if (p.name !== undefined) update.name = p.name;
  if (p.slug !== undefined) update.slug = p.slug;
  if (p.description !== undefined) update.description = p.description;
  if (p.longDescription !== undefined) update.long_description = p.longDescription;
  if (p.metaDescription !== undefined) update.meta_description = p.metaDescription;
  if (p.parentId !== undefined) update.parent_id = p.parentId;
  if (p.imageUrl !== undefined) update.image_url = p.imageUrl || null;
  if (p.sortOrder !== undefined) update.sort_order = p.sortOrder;
  if (p.isVisible !== undefined) update.is_visible = p.isVisible;

  const { error } = await auth.supabase
    .from("categories")
    .update(update)
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { error } = await auth.supabase
    .from("categories")
    .delete()
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
