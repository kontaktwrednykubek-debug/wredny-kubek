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
 * GET /api/shop-products/[slug] — pobierz dane produktu (publiczne).
 */
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createSupabaseServerClient();
  
  const { data: product, error } = await supabase
    .from("shop_products")
    .select("slug, title, variant_stock, show_variant_stock")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
    
  if (error) {
    console.error("[shop-products GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  
  return NextResponse.json({
    slug: product.slug,
    title: product.title,
    variant_stock: product.variant_stock,
    show_variant_stock: product.show_variant_stock,
  });
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
    colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
    cupColors: z.array(z.object({ id: z.string(), name: z.string(), imageUrl: z.string() })).optional(),
    capacities: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    options: z.array(z.object({ label: z.string(), values: z.array(z.string()) })).optional(),
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
  body: z.string().max(20000).optional(),
  category: z.string().max(50).optional(),
  priceGrosze: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  specs: z.record(z.string()).optional(),
  variants: variantsSchema.optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  showVariantStock: z.boolean().optional(),
  variantStock: z.record(z.number().int().min(0)).optional(),
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
  if (p.body !== undefined) update.body = p.body;
  if (p.category !== undefined) update.category = p.category;
  if (p.priceGrosze !== undefined) update.price_grosze = p.priceGrosze;
  if (p.images !== undefined) update.images = p.images;
  if (p.specs !== undefined) update.specs = p.specs;
  if (p.variants !== undefined) update.variants = p.variants;
  if (p.rating !== undefined) update.rating = p.rating;
  if (p.reviewsCount !== undefined) update.reviews_count = p.reviewsCount;
  if (p.isPublished !== undefined) update.is_published = p.isPublished;
  if (p.showVariantStock !== undefined) update.show_variant_stock = p.showVariantStock;
  if (p.variantStock !== undefined) update.variant_stock = p.variantStock;

  const { data, error } = await auth.supabase
    .from("shop_products")
    .update(update)
    .eq("slug", params.slug)
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync variant_stock JSONB -> product_variants table (single source of truth for RPC)
  if (p.variantStock !== undefined && data?.id) {
    const variantStock = p.variantStock as Record<string, number>;
    const variantIds = Object.keys(variantStock);
    
    if (variantIds.length > 0) {
      // Upsert per-product stock for each variant
      const rows = variantIds.map(variantId => ({
        product_id: data.id,
        variant_id: variantId,
        stock_count: variantStock[variantId] ?? 0,
        updated_at: new Date().toISOString(),
      }));
      
      const { error: upsertErr } = await auth.supabase
        .from("product_variants")
        .upsert(rows, { onConflict: "product_id,variant_id" });
      
      if (upsertErr) {
        console.error("[shop-products PATCH] Failed to sync product_variants:", upsertErr);
      } else {
        console.log("[shop-products PATCH] Synced", rows.length, "variants to product_variants table");
      }
    }
  }

  return NextResponse.json({ product: data });
}
