import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdultCategorySlugs } from "@/lib/adult";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://wrednykubek.pl"
).replace(/\/$/, "");

// Odświeżaj sitemapę co godzinę.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServerClient();

  // Strony statyczne (publiczne).
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/sklep`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/nowosci`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/kontakt`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/regulamin`, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${BASE_URL}/polityka-prywatnosci`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Kategorie 18+ — wykluczone z indeksowania (dostępne na stronie za bramką wieku).
  const adultCatSlugs = await getAdultCategorySlugs(supabase);
  const isAdultProduct = (p: { category?: unknown; categories?: unknown }) => {
    const cats =
      (p.categories as string[] | null) ?? [(p.category as string | null) ?? ""];
    return cats.some((c) => adultCatSlugs.has(c));
  };

  // Produkty opublikowane (bez 18+).
  const { data: products } = await supabase
    .from("shop_products")
    .select("slug, updated_at, category, categories")
    .eq("is_published", true);

  const productRoutes: MetadataRoute.Sitemap = (products ?? [])
    .filter((p) => !isAdultProduct(p))
    .map((p) => ({
      url: `${BASE_URL}/sklep/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at as string) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  // Kategorie widoczne (bez 18+; czysty adres /sklep/kategoria/<slug>).
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .neq("is_visible", false);

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => !adultCatSlugs.has(c.slug as string))
    .map((c) => ({
      url: `${BASE_URL}/sklep/kategoria/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
