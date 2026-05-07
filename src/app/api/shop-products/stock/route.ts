import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const body = await req.json();
  const { slugs, variantIds } = body as { slugs?: string[]; variantIds?: string[] };
  
  if (!variantIds || !Array.isArray(variantIds)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  
  // Fetch current stock for variants
  const { data: variants, error } = await supabase
    .from("cup_color_variants")
    .select("id, name, stock_count")
    .in("id", variantIds);
    
  if (error) {
    console.error("[stock-api] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Build stock map
  const stockMap = new Map();
  variants?.forEach((v: any) => {
    stockMap.set(v.id, v.stock_count);
  });
  
  return NextResponse.json({ 
    stock: Object.fromEntries(stockMap) 
  });
}
