import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

/**
 * GET /api/tiktoks — publiczna lista aktywnych filmów do karuzeli,
 * wraz z powiązanymi produktami (slug, tytuł, cena, zdjęcie).
 */
export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data: tiktoks, error } = await supabase
    .from("tiktoks")
    .select("id, video_id, thumbnail_url, title, author, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ tiktoks: [] });
  if (!tiktoks || tiktoks.length === 0) return NextResponse.json({ tiktoks: [] });

  const ids = tiktoks.map((t) => t.id);
  const { data: links } = await supabase
    .from("tiktok_products")
    .select("tiktok_id, product_slug, sort_order")
    .in("tiktok_id", ids)
    .order("sort_order", { ascending: true });

  const slugs = [...new Set((links ?? []).map((l) => l.product_slug))];
  const productMap = new Map<string, { slug: string; title: string; price_grosze: number; images: string[] | null }>();
  if (slugs.length > 0) {
    const { data: products } = await supabase
      .from("shop_products")
      .select("slug, title, price_grosze, images")
      .in("slug", slugs)
      .eq("is_published", true);
    for (const p of products ?? []) productMap.set(p.slug as string, p as never);
  }

  const result = tiktoks.map((t) => ({
    id: t.id,
    videoId: t.video_id,
    thumbnailUrl: t.thumbnail_url,
    title: t.title,
    author: t.author,
    products: (links ?? [])
      .filter((l) => l.tiktok_id === t.id)
      .map((l) => productMap.get(l.product_slug))
      .filter((p): p is NonNullable<typeof p> => Boolean(p)),
  }));

  return NextResponse.json({ tiktoks: result });
}
