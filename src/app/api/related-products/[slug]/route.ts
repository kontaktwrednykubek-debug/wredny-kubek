import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const serviceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

const PRODUCT_SELECT = "id, slug, title, price_grosze, images";

// GET /api/related-products/[slug]
// 1. Pobiera ręcznie przypisane related_product_ids
// 2. Uzupełnia do 4 wektorowo podobnymi produktami
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = serviceClient();

  // Pobierz produkt + embedding + related_product_ids
  const { data: product } = await supabase
    .from("shop_products")
    .select("id, embedding, related_product_ids")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!product) return NextResponse.json({ products: [] });

  const manualIds: string[] = (product.related_product_ids as string[]) ?? [];
  const results: Record<string, unknown>[] = [];

  // 1. Pobierz ręcznie przypisane
  if (manualIds.length > 0) {
    const { data } = await supabase
      .from("shop_products")
      .select(PRODUCT_SELECT)
      .in("id", manualIds)
      .eq("is_published", true)
      .neq("id", product.id);
    for (const p of data ?? []) results.push(p);
  }

  // 2. Uzupełnij wektorowo jeśli mniej niż 4
  if (results.length < 4 && product.embedding) {
    const existingIds = new Set([product.id, ...results.map((p) => p.id as string)]);
    const needed = 4 - results.length;

    const { data: vectorData } = await supabase.rpc("match_products", {
      query_embedding: product.embedding,
      match_threshold: 0.1,
      match_count: needed + 1,
    });

    for (const p of vectorData ?? []) {
      if (!existingIds.has(p.id) && results.length < 4) {
        // Pobierz pełne dane produktu
        const { data: full } = await supabase
          .from("shop_products")
          .select(PRODUCT_SELECT)
          .eq("id", p.id)
          .eq("is_published", true)
          .maybeSingle();
        if (full) {
          results.push(full);
          existingIds.add(p.id);
        }
      }
    }
  }

  return NextResponse.json({ products: results.slice(0, 4) });
}
