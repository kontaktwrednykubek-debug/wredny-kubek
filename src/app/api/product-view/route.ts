import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const serviceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// POST /api/product-view  { product_id }
// Zapisuje widok; blokuje ponowny zapis z tego samego IP przez 24h
export async function POST(req: NextRequest) {
  const { product_id } = await req.json().catch(() => ({}));
  if (!product_id) return NextResponse.json({ ok: false });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Haszujemy IP — nie przechowujemy danych osobowych
  const ip_hash = createHash("sha256").update(ip).digest("hex");

  const supabase = serviceClient();

  // Sprawdź czy IP już liczyło ten produkt w ostatnich 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("page_views")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product_id)
    .eq("ip_hash", ip_hash)
    .gte("created_at", since);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: false, reason: "already_counted" });
  }

  await supabase.from("page_views").insert({ product_id, ip_hash });
  return NextResponse.json({ ok: true });
}

// GET /api/product-view?product_id=xxx&days=7
// Zwraca liczbę unikalnych IP w oknie czasowym + view_count_base
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const product_id = searchParams.get("product_id");
  const days = parseInt(searchParams.get("days") ?? "7", 10);
  if (!product_id) return NextResponse.json({ count: 0 });

  const supabase = serviceClient();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Unikalne IP w oknie
  const { data } = await supabase
    .from("page_views")
    .select("ip_hash")
    .eq("product_id", product_id)
    .gte("created_at", since);

  const unique = new Set((data ?? []).map((r) => r.ip_hash)).size;

  // Pobierz base + show_view_counter
  const { data: product } = await supabase
    .from("shop_products")
    .select("view_count_base, show_view_counter")
    .eq("id", product_id)
    .maybeSingle();

  if (!product?.show_view_counter) {
    return NextResponse.json({ count: 0, visible: false });
  }

  return NextResponse.json({
    count: unique + (product.view_count_base ?? 0),
    visible: true,
  });
}
