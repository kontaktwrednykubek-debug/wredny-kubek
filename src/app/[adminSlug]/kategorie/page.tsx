import { createSupabaseServerClient } from "@/lib/supabase/server";
import { KategorieAdmin, type CategoryRow } from "./KategorieAdmin";

export const metadata = { title: "Kategorie" };

export default async function KategoriePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description, long_description, meta_description, image_url, parent_id, sort_order, is_visible")
    .order("sort_order", { ascending: true });

  const categories: CategoryRow[] = (data ?? []).map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    description: (c.description as string) ?? "",
    long_description: (c.long_description as string | null) ?? null,
    meta_description: (c.meta_description as string | null) ?? null,
    image_url: (c.image_url as string | null) ?? null,
    parent_id: (c.parent_id as string | null) ?? null,
    sort_order: (c.sort_order as number) ?? 100,
    is_visible: (c.is_visible as boolean | null) ?? true,
  }));

  return <KategorieAdmin categories={categories} />;
}
