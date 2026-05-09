import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// GET /api/reviews?slug=xxx
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Brak slug" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, author_name, rating, body, image_url, created_at")
    .eq("product_slug", slug)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[reviews GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

// POST /api/reviews — auth required
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Musisz być zalogowany" }, { status: 401 });
  }

  const body = await request.json();
  const { product_slug, rating, review_body, image_url } = body;

  if (!product_slug || !rating || !review_body) {
    return NextResponse.json({ error: "Brakuje wymaganych pól" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Ocena musi być między 1 a 5" }, { status: 400 });
  }
  if (review_body.trim().length < 10) {
    return NextResponse.json({ error: "Opinia musi mieć co najmniej 10 znaków" }, { status: 400 });
  }

  // Get author name from profile
  const service = createSupabaseServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const rawName: string = profile?.full_name?.trim() || "Klient";
  const author_name = rawName.split(" ")[0];

  const { data: review, error } = await service
    .from("product_reviews")
    .insert({
      product_slug,
      user_id: user.id,
      author_name,
      rating: Number(rating),
      body: review_body.trim(),
      image_url: image_url || null,
    })
    .select("id, author_name, rating, body, image_url, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Już dodałeś opinię dla tego produktu" },
        { status: 409 }
      );
    }
    console.error("[reviews POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Refresh aggregates
  await service.rpc("refresh_product_rating", { p_slug: product_slug });

  return NextResponse.json({ review }, { status: 201 });
}
