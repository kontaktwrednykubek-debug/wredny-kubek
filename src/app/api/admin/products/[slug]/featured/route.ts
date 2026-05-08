import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/products/[slug]/featured
 * Body: { featured: boolean }
 * Toggles is_featured on a product. Max 15 featured products enforced.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { featured } = (await req.json().catch(() => ({}))) as { featured?: boolean };
  if (typeof featured !== "boolean") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (featured) {
    const { count } = await supabase
      .from("shop_products")
      .select("id", { count: "exact", head: true })
      .eq("is_featured", true);
    if ((count ?? 0) >= 15) {
      return NextResponse.json(
        { error: "Limit 15 polecanych produktów osiągnięty. Odznacz inny, aby dodać ten." },
        { status: 422 },
      );
    }
  }

  const { error } = await supabase
    .from("shop_products")
    .update({ is_featured: featured })
    .eq("slug", params.slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, featured });
}
