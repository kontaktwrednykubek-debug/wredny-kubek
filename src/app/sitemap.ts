import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  // Produkty opublikowane.
  const { data: products } = await supabase
    .from("shop_products")
    .select("slug, updated_at")
    .eq("is_published", true);

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/sklep/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at as string) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Kategorie widoczne (filtr przez parametr ?category=).
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .neq("is_visible", false);

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${BASE_URL}/sklep?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
