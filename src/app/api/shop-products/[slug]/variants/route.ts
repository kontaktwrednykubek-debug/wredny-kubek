import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createSupabaseServerClient();
  
  // Get product ID from slug
  const { data: product, error: productFetchError } = await supabase
    .from("shop_products")
    .select("id")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
    
  if (productFetchError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  
  // Get all cup variants with global stock and per-product limits
  const { data: globalVariants, error: globalError } = await supabase
    .from("cup_color_variants")
    .select("id, name, image_url, sort_order, stock_count")
    .order("sort_order", { ascending: true });
    
  // Get per-product variant limits
  const { data: productVariants, error: productVariantError } = await supabase
    .from("product_variants")
    .select("variant_id, stock_count")
    .eq("product_id", product.id);
    
  if (globalError || productVariantError) {
    console.error("[product-variants] Error:", { globalError, productVariantError });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  
  // Create per-product stock map
  const productStockMap = new Map();
  productVariants?.forEach((pv: any) => {
    productStockMap.set(pv.variant_id, pv.stock_count);
  });
  
  // Transform data to match expected format
  const variants = globalVariants?.map((item: any) => {
    const globalStock = item.stock_count;
    const productStock = productStockMap.get(item.id) ?? 999; // Default to high number if not set
    const availableStock = Math.min(globalStock, productStock); // Use minimum of both
    
    return {
      id: item.id,
      name: item.name,
      imageUrl: item.image_url,
      sortOrder: item.sort_order,
      stockCount: availableStock,
      globalStock, // For admin reference
      productStock, // For admin reference
    };
  }) ?? [];
  
  return NextResponse.json({ variants });
}
