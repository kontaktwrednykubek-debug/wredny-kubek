import { NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (po konwersji zostaje znacznie mniej)
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

// Maksymalne wymiary dla zdjęć produktów (zachowujemy proporcje, tylko ograniczamy).
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const WEBP_QUALITY = 82;

/**
 * POST /api/shop-products/upload — upload zdjęcia produktu (multipart/form-data).
 * Tylko ADMIN. Konwertuje wszystkie zdjęcia do WebP (oszczędność miejsca w bazie).
 * Zwraca publiczny URL.
 */
export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  // Konwersja → WebP (z resize'em, jeśli zbyt duże).
  let webpBuffer: Buffer;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    webpBuffer = await sharp(inputBuffer, { animated: file.type === "image/gif" })
      .rotate() // korekcja EXIF
      .resize({
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();
  } catch (err) {
    console.error("[upload] sharp conversion failed:", err);
    return NextResponse.json(
      { error: "conversion_failed" },
      { status: 500 },
    );
  }

  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  const { error } = await supabase.storage
    .from("shop-products")
    .upload(path, webpBuffer, {
      contentType: "image/webp",
      upsert: false,
    });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("shop-products").getPublicUrl(path);
  return NextResponse.json({
    url: data.publicUrl,
    path,
    originalSize: file.size,
    finalSize: webpBuffer.length,
    savedBytes: file.size - webpBuffer.length,
  });
}
