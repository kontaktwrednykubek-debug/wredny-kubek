import { createSupabaseServerClient } from "@/lib/supabase/server";
import { KategorieAdmin, type CategoryRow } from "./KategorieAdmin";

export const metadata = { title: "Kategorie" };

export default async function KategoriePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description, parent_id, sort_order")
    .order("sort_order", { ascending: true });

  const categories: CategoryRow[] = (data ?? []).map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    description: (c.description as string) ?? "",
    parent_id: (c.parent_id as string | null) ?? null,
    sort_order: (c.sort_order as number) ?? 100,
  }));

  return <KategorieAdmin categories={categories} />;
}
