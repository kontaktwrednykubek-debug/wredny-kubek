import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/wishlist — slugs saved by current user
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ slugs: [] });

  const { data } = await supabase
    .from("wishlists")
    .select("product_slug")
    .eq("user_id", user.id);

  return NextResponse.json({ slugs: (data ?? []).map((r) => r.product_slug) });
}

// POST /api/wishlist — toggle (add / remove)
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "Brakuje slug" }, { status: 400 });

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_slug", slug)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    return NextResponse.json({ saved: false });
  } else {
    await supabase.from("wishlists").insert({ user_id: user.id, product_slug: slug });
    return NextResponse.json({ saved: true });
  }
}
