import { NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Wymiary karty Open Graph oczekiwane przez Facebooka/Twittera (1.91:1).
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export const runtime = "nodejs";
// Cache na CDN: obrazek zmienia się rzadko, a generowanie jest kosztowne.
export const revalidate = 86400;

/**
 * Serwuje zdjęcie produktu jako JPEG 1200×630 dla podglądów społecznościowych.
 * Powód: oryginały są w WebP, a Facebook/Messenger bywają zawodne z WebP —
 * JPEG w poprawnym formacie zawsze renderuje się w podglądzie linku.
 * Endpoint używany wyłącznie przez roboty (og:image), nie przez zwykłych
 * użytkowników sklepu.
 */
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase
    .from("shop_products")
    .select("images")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();

  const cover = ((product?.images as string[] | null) ?? [])[0];
  if (!cover) {
    return NextResponse.json({ error: "No image" }, { status: 404 });
  }

  try {
    const res = await fetch(cover);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const input = Buffer.from(await res.arrayBuffer());

    const jpeg = await sharp(input)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
      .jpeg({ quality: 82 })
      .toBuffer();

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[og-image] Failed for", params.slug, err);
    return NextResponse.json({ error: "Image processing failed" }, { status: 500 });
  }
}
