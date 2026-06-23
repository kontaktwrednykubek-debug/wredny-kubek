import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createSupabaseServerClient();
  
  // Get product ID and selected variants (cupColors) from slug
  const { data: product, error: productFetchError } = await supabase
    .from("shop_products")
    .select("id, variants")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
    
  if (productFetchError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  
  // Extract selected cup color IDs from product.variants JSONB
  const selectedCupColors = (product.variants as any)?.cupColors as
    | Array<{ id: string; priceGrosze?: number | null }>
    | undefined;
  const selectedIds = selectedCupColors?.map((c) => c.id) ?? [];
  // Mapa cen custom per wariant (null = cena bazowa produktu)
  const priceMap = new Map<string, number | null>();
  selectedCupColors?.forEach((c) => priceMap.set(c.id, c.priceGrosze ?? null));
  
  // If admin didn't select any colors, return empty list
  if (selectedIds.length === 0) {
    return NextResponse.json({ variants: [] });
  }
  
  // Get only the selected cup variants with global stock + global price
  const { data: globalVariants, error: globalError } = await supabase
    .from("cup_color_variants")
    .select("id, name, image_url, sort_order, stock_count, price_grosze, materials, extra_info")
    .in("id", selectedIds)
    .order("sort_order", { ascending: true });
    
  if (globalError) {
    console.error("[product-variants] Error:", { globalError });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Stan magazynowy = JEDEN wspólny stan globalny per kolor (cup_color_variants).
  // Produkty dzielące ten sam kolor korzystają z tej samej puli.
  const variants = globalVariants?.map((item: any) => {
    const globalStock = item.stock_count ?? 0;

    return {
      id: item.id,
      name: item.name,
      imageUrl: item.image_url,
      sortOrder: item.sort_order,
      stockCount: globalStock,
      // Cena: nadpisanie per produkt > globalna cena koloru > null (=cena bazowa)
      priceGrosze: priceMap.get(item.id) ?? item.price_grosze ?? null,
      // Specyfikacja globalna koloru — zmienia się wraz z wybranym wariantem.
      materials: (item.materials as string[] | null) ?? [],
      extraInfo: (item.extra_info as string[] | null) ?? [],
      globalStock, // For admin reference
    };
  }) ?? [];
  
  return NextResponse.json({ variants });
}
