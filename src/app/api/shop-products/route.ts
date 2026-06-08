import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geminiEmbed } from "@/lib/gemini";

/**
 * GET /api/shop-products — lista opublikowanych produktów (publiczne).
 */
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shop_products")
    .select(
      "id, slug, title, description, price_grosze, currency, images, rating, reviews_count, created_at",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ products: data ?? [] });
}

/**
 * POST /api/shop-products — utworzenie nowego produktu (tylko ADMIN).
 */
const variantsSchema = z
  .object({
    colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
    cupColors: z.array(z.object({ id: z.string(), name: z.string(), imageUrl: z.string() })).optional(),
    capacities: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    options: z.array(z.object({ label: z.string(), values: z.array(z.string()) })).optional(),
  })
  .default({});

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug: małe litery, cyfry, myślniki"),
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().default(""),
  body: z.string().max(20000).optional().default(""),
  category: z.string().max(50).default("merch"),
  categories: z.array(z.string().max(50)).max(10).optional(),
  priceGrosze: z.number().int().min(0),
  images: z.array(z.string().url()).max(10).default([]),
  specs: z.record(z.string()).default({}),
  variants: variantsSchema,
  rating: z.number().min(0).max(5).default(0),
  reviewsCount: z.number().int().min(0).default(0),
  showVariantStock: z.boolean().default(false),
  variantStock: z.record(z.number().int().min(0)).default({}),
  showViewCounter: z.boolean().default(false),
  viewCountBase: z.number().int().min(0).default(0),
  viewCountPeriod: z.number().int().min(0).default(7),
  relatedProductIds: z.array(z.string().uuid()).max(20).default([]),
  tags: z.array(z.string().max(50)).max(30).default([]),
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

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const p = parsed.data;

  const { data, error } = await auth.supabase
    .from("shop_products")
    .insert({
      slug: p.slug,
      title: p.title,
      description: p.description,
      body: p.body,
      category: p.categories?.[0] ?? p.category,
      categories: p.categories ?? [p.category],
      embedding: await geminiEmbed(
        [p.title, p.description, p.body, ...(p.categories ?? [p.category]), ...p.tags].filter(Boolean).join(" ")
      ).catch(() => null),
      price_grosze: p.priceGrosze,
      images: p.images,
      specs: p.specs,
      variants: p.variants,
      rating: p.rating,
      reviews_count: p.reviewsCount,
      show_variant_stock: p.showVariantStock,
      variant_stock: p.variantStock,
      show_view_counter: p.showViewCounter,
      view_count_base: p.viewCountBase,
      view_count_period: p.viewCountPeriod,
      related_product_ids: p.relatedProductIds,
      tags: p.tags,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data });
}
