import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

/**
 * DELETE /api/shop-products/[slug] — usunięcie produktu (tylko ADMIN).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { error } = await auth.supabase
    .from("shop_products")
    .delete()
    .eq("slug", params.slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

const variantsSchema = z
  .object({
    colors: z
      .array(z.object({ name: z.string(), hex: z.string() }))
      .optional(),
    sizes: z.array(z.string()).optional(),
    options: z
      .array(z.object({ label: z.string(), values: z.array(z.string()) }))
      .optional(),
  })
  .default({});

const updateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug: małe litery, cyfry, myślniki")
    .optional(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.string().max(50).optional(),
  priceGrosze: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  specs: z.record(z.string()).optional(),
  variants: variantsSchema.optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

/**
 * PATCH /api/shop-products/[slug] — edycja produktu (tylko ADMIN).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const p = parsed.data;
  const update: Record<string, unknown> = {};
  if (p.slug !== undefined) update.slug = p.slug;
  if (p.title !== undefined) update.title = p.title;
  if (p.description !== undefined) update.description = p.description;
  if (p.category !== undefined) update.category = p.category;
  if (p.priceGrosze !== undefined) update.price_grosze = p.priceGrosze;
  if (p.images !== undefined) update.images = p.images;
  if (p.specs !== undefined) update.specs = p.specs;
  if (p.variants !== undefined) update.variants = p.variants;
  if (p.rating !== undefined) update.rating = p.rating;
  if (p.reviewsCount !== undefined) update.reviews_count = p.reviewsCount;
  if (p.isPublished !== undefined) update.is_published = p.isPublished;

  const { data, error } = await auth.supabase
    .from("shop_products")
    .update(update)
    .eq("slug", params.slug)
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data });
}
