import type { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Zwraca zbiór slugów kategorii oznaczonych jako 18+ (flaga is_adult lub
 * nazwa/slug zawierające 18/wulgar/doros). Dziecko kategorii dla dorosłych
 * również jest 18+. Używane do blokowania produktów na listach sklepu.
 */
export async function getAdultCategorySlugs(
  supabase: ReturnType<typeof createSupabaseServerClient>,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, parent_id, is_adult");
  const rows = (data ?? []) as {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
    is_adult: boolean | null;
  }[];
  const isAdultCat = (c?: (typeof rows)[number] | null) =>
    !!c && (c.is_adult === true || /18\+?|wulgar|doros/i.test(`${c.slug ?? ""} ${c.name ?? ""}`));
  const set = new Set<string>();
  rows.forEach((c) => {
    const parent = c.parent_id ? rows.find((x) => x.id === c.parent_id) : null;
    if (isAdultCat(c) || isAdultCat(parent)) set.add(c.slug);
  });
  return set;
}
