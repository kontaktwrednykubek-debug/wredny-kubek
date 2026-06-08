import { NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const BANNER_WIDTH = 1920;
const BANNER_HEIGHT = 600;
const WEBP_QUALITY = 85;

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 });

  let webpBuffer: Buffer;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    webpBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        fit: "cover",
        position: "center",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "conversion_failed" }, { status: 500 });
  }

  const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  const { error } = await supabase.storage
    .from("shop-products")
    .upload(path, webpBuffer, { contentType: "image/webp", upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from("shop-products").getPublicUrl(path);
  return NextResponse.json({
    url: data.publicUrl,
    path,
    originalSize: file.size,
    finalSize: webpBuffer.length,
  });
}
