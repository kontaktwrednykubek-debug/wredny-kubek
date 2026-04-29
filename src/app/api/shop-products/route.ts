import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    colors: z
      .array(z.object({ name: z.string(), hex: z.string() }))
      .optional(),
    sizes: z.array(z.string()).optional(),
    options: z
      .array(
        z.object({
          label: z.string(),
          values: z.array(z.string()),
        }),
      )
      .optional(),
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
  category: z.string().max(50).default("merch"),
  priceGrosze: z.number().int().min(0),
  images: z.array(z.string().url()).max(10).default([]),
  specs: z.record(z.string()).default({}),
  variants: variantsSchema,
  rating: z.number().min(0).max(5).default(0),
  reviewsCount: z.number().int().min(0).default(0),
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
      category: p.category,
      price_grosze: p.priceGrosze,
      images: p.images,
      specs: p.specs,
      variants: p.variants,
      rating: p.rating,
      reviews_count: p.reviewsCount,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data });
}
