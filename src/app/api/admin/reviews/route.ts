import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const service = createSupabaseServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "ADMIN" ? user : null;
}

// GET /api/admin/reviews — all reviews (pending + approved)
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = request.nextUrl.searchParams.get("slug");
  const service = createSupabaseServiceClient();

  let query = service
    .from("product_reviews")
    .select("id, product_slug, author_name, rating, body, image_url, is_approved, created_at")
    .order("created_at", { ascending: false });

  if (slug) query = query.eq("product_slug", slug);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviews: data ?? [] });
}

// PATCH /api/admin/reviews — approve/reject
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, is_approved } = await request.json();
  if (!id || typeof is_approved !== "boolean") {
    return NextResponse.json({ error: "Brakuje id lub is_approved" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from("product_reviews")
    .update({ is_approved })
    .eq("id", id)
    .select("product_slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await service.rpc("refresh_product_rating", { p_slug: data.product_slug });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/reviews?id=xxx
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Brakuje id" }, { status: 400 });

  const service = createSupabaseServiceClient();

  const { data: review } = await service
    .from("product_reviews")
    .select("product_slug")
    .eq("id", id)
    .single();

  const { error } = await service.from("product_reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (review?.product_slug) {
    await service.rpc("refresh_product_rating", { p_slug: review.product_slug });
  }

  return NextResponse.json({ ok: true });
}
