import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StockRequestItem = { slug: string; variantId?: string | null };

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const body = await req.json();
  const { items, variantIds } = body as {
    items?: StockRequestItem[];
    variantIds?: string[];
  };

  // New format: items with slug (+ optional variantId) return the applicable stock.
  if (items && Array.isArray(items)) {
    // Kolory: stan globalny per wariant. Bez wariantu: stan bazowy z produktu.
    const variantIds = items
      .map(i => i.variantId)
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    const baseSlugs = [
      ...new Set(items.filter(i => !i.variantId).map(i => i.slug)),
    ];

    // Fetch global stock (JEDEN wspólny stan per kolor — bez limitów per-produkt).
    const { data: globalVariants } = variantIds.length
      ? await supabase
          .from("cup_color_variants")
          .select("id, stock_count")
          .in("id", variantIds)
      : { data: [] as { id: string; stock_count: number }[] };
    const globalMap = new Map(globalVariants?.map(v => [v.id, v.stock_count]) ?? []);

    // Stan bazowy produktów bez wariantów — z pola specs["Ilość"] (jak na
    // stronie produktu). Brak wartości = brak limitu (999).
    const baseMap = new Map<string, number>();
    if (baseSlugs.length) {
      const { data: prods } = await supabase
        .from("shop_products")
        .select("slug, specs")
        .in("slug", baseSlugs);
      prods?.forEach(p => {
        const specs = (p.specs as Record<string, string> | null) ?? {};
        const parsed = parseInt(specs["Ilość"] ?? "", 10);
        baseMap.set(p.slug as string, Number.isFinite(parsed) ? parsed : 999);
      });
    }

    // Build stock map. Klucz: `${slug}:${variantId}` dla koloru,
    // `${slug}:` (pusty wariant) dla produktu bez wariantów.
    const stockMap: Record<string, number> = {};
    items.forEach(item => {
      if (item.variantId) {
        stockMap[`${item.slug}:${item.variantId}`] = globalMap.get(item.variantId) ?? 0;
      } else {
        stockMap[`${item.slug}:`] = baseMap.get(item.slug) ?? 999;
      }
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
