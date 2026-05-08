import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StockRequestItem = { slug: string; variantId: string };

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const body = await req.json();
  const { items, variantIds } = body as { 
    items?: StockRequestItem[]; 
    variantIds?: string[];
  };
  
  // New format: items with slug+variantId returns min(global, per-product)
  if (items && Array.isArray(items)) {
    const variantIds = items.map(i => i.variantId);
    const slugs = [...new Set(items.map(i => i.slug))];
    
    // Fetch global stock
    const { data: globalVariants } = await supabase
      .from("cup_color_variants")
      .select("id, stock_count")
      .in("id", variantIds);
    
    // Fetch product IDs for slugs
    const { data: products } = await supabase
      .from("shop_products")
      .select("id, slug")
      .in("slug", slugs);
    
    const productMap = new Map(products?.map(p => [p.slug, p.id]) ?? []);
    const productIds = Array.from(productMap.values());
    
    // Fetch per-product stock
    const { data: productVariants } = await supabase
      .from("product_variants")
      .select("product_id, variant_id, stock_count")
      .in("product_id", productIds)
      .in("variant_id", variantIds);
    
    const globalMap = new Map(globalVariants?.map(v => [v.id, v.stock_count]) ?? []);
    const productStockMap = new Map<string, number>();
    productVariants?.forEach(pv => {
      productStockMap.set(`${pv.product_id}:${pv.variant_id}`, pv.stock_count);
    });
    
    // Build stock map: key = `${slug}:${variantId}`, value = min(global, per-product)
    const stockMap: Record<string, number> = {};
    items.forEach(item => {
      const productId = productMap.get(item.slug);
      const global = globalMap.get(item.variantId) ?? 0;
      const perProduct = productId 
        ? productStockMap.get(`${productId}:${item.variantId}`) ?? 999999
        : 999999;
      stockMap[`${item.slug}:${item.variantId}`] = Math.min(global, perProduct);
    });
    
    return NextResponse.json({ stock: stockMap });
  }
  
  // Legacy format: just variantIds returns global stock only
  if (!variantIds || !Array.isArray(variantIds)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  
  const { data: variants, error } = await supabase
    .from("cup_color_variants")
    .select("id, name, stock_count")
    .in("id", variantIds);
    
  if (error) {
    console.error("[stock-api] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const stockMap = new Map();
  variants?.forEach((v: any) => {
    stockMap.set(v.id, v.stock_count);
  });
  
  return NextResponse.json({ 
    stock: Object.fromEntries(stockMap) 
  });
}
