import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createSupabaseServerClient();
  
  // Get product ID from slug
  const { data: product, error: productError } = await supabase
    .from("shop_products")
    .select("id")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
    
  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  
  // Get all cup variants with their global stock counts
  const { data, error } = await supabase
    .from("cup_color_variants")
    .select("id, name, image_url, sort_order, stock_count")
    .order("sort_order", { ascending: true });
    
  if (error) {
    console.error("[product-variants] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Transform data to match expected format
  const variants = data?.map((item: any) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.image_url,
    sortOrder: item.sort_order,
    stockCount: item.stock_count,
  })) ?? [];
  
  return NextResponse.json({ variants });
}
