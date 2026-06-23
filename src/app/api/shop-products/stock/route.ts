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
    
    // Fetch global stock (JEDEN wspólny stan per kolor — bez limitów per-produkt).
    const { data: globalVariants } = await supabase
      .from("cup_color_variants")
      .select("id, stock_count")
      .in("id", variantIds);

    void slugs;
    const globalMap = new Map(globalVariants?.map(v => [v.id, v.stock_count]) ?? []);

    // Build stock map: key = `${slug}:${variantId}`, value = stan globalny koloru.
    const stockMap: Record<string, number> = {};
    items.forEach(item => {
      stockMap[`${item.slug}:${item.variantId}`] = globalMap.get(item.variantId) ?? 0;
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
