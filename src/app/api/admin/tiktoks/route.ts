import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { fetchTikTokOembed } from "@/lib/tiktok";

export const runtime = "nodejs";

async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") return null;
  return user;
}

/**
 * Pobiera miniaturę z TikToka i zapisuje ją na stałe w Supabase Storage,
 * żeby nie zniknęła gdy TikTok wygasi tymczasowy URL. Zwraca publiczny URL
 * lub null gdy się nie uda (wtedy używamy oryginalnego URL jako fallback).
 */
async function storeThumbnail(
  thumbnailUrl: string | null,
  videoId: string,
): Promise<string | null> {
  if (!thumbnailUrl) return null;
  try {
    const res = await fetch(thumbnailUrl, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return thumbnailUrl;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const path = `tiktoks/${videoId}-${Date.now()}.${ext}`;

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.storage
      .from("shop-products")
      .upload(path, buffer, { contentType, upsert: true });
    if (error) {
      console.error("[tiktoks] thumbnail upload failed:", error);
      return thumbnailUrl; // fallback do oryginalnego URL
    }
    const { data } = supabase.storage.from("shop-products").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("[tiktoks] storeThumbnail error:", err);
    return thumbnailUrl;
  }
}

export async function GET() {
  const supabase = createSupabaseServiceClient();
  const { data: tiktoks, error } = await supabase
    .from("tiktoks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: links } = await supabase
    .from("tiktok_products")
    .select("*")
    .order("sort_order", { ascending: true });

  // Dociągnij dane produktów (tytuł, zdjęcie, cena) po slug.
  const slugs = [...new Set((links ?? []).map((l) => l.product_slug))];
  const productMap = new Map<string, { slug: string; title: string; price_grosze: number; images: string[] | null }>();
  if (slugs.length > 0) {
    const { data: products } = await supabase
      .from("shop_products")
      .select("slug, title, price_grosze, images")
      .in("slug", slugs);
    for (const p of products ?? []) productMap.set(p.slug as string, p as never);
  }

  const result = (tiktoks ?? []).map((t) => ({
    ...t,
    products: (links ?? [])
      .filter((l) => l.tiktok_id === t.id)
      .map((l) => ({
        ...(productMap.get(l.product_slug) ?? { title: l.product_slug, price_grosze: 0, images: null }),
        slug: l.product_slug,
      })),
  }));

  return NextResponse.json({ tiktoks: result });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { tiktok_url, product_slugs } = await req.json();
  if (!tiktok_url || typeof tiktok_url !== "string") {
    return NextResponse.json({ error: "Wklej link do TikToka." }, { status: 400 });
  }

  // 1. Pobierz metadane z oEmbed
  let oembed;
  try {
    oembed = await fetchTikTokOembed(tiktok_url.trim());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Nie udało się pobrać danych z TikToka." },
      { status: 400 },
    );
  }

  // 2. Zapisz miniaturę na stałe
  const thumbnailUrl = await storeThumbnail(oembed.thumbnailUrl, oembed.videoId);

  // 3. Ustal sort_order na koniec listy
  const supabase = createSupabaseServiceClient();
  const { data: last } = await supabase
    .from("tiktoks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last?.sort_order ?? -1) + 1;

  // 4. Wstaw film
  const { data: tiktok, error } = await supabase
    .from("tiktoks")
    .insert({
      tiktok_url: tiktok_url.trim(),
      video_id: oembed.videoId,
      thumbnail_url: thumbnailUrl,
      title: oembed.title,
      author: oembed.author,
      sort_order: sortOrder,
      is_active: true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 5. Powiąż produkty (jeśli przekazane)
  const slugs: string[] = Array.isArray(product_slugs) ? product_slugs.filter(Boolean) : [];
  if (slugs.length > 0) {
    await supabase.from("tiktok_products").insert(
      slugs.map((slug, idx) => ({
        tiktok_id: tiktok.id,
        product_slug: slug,
        sort_order: idx,
      })),
    );
  }

  return NextResponse.json({ tiktok });
}
