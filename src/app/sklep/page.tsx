import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ShopFilters, type Category } from "./ShopFilters";

export const metadata = { title: "Sklep" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: { category?: string; minPrice?: string; maxPrice?: string; q?: string };
}) {
  const supabase = createSupabaseServerClient();

  // Pobierz kategorie i wszystkie opublikowane produkty równolegle.
  const [categoriesRes, allRangeRes, productsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, parent_id, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("shop_products")
      .select("price_grosze")
      .eq("is_published", true),
    supabase
      .from("shop_products")
      .select(
        "slug, title, price_grosze, images, rating, reviews_count, category",
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  const categories: Category[] = (categoriesRes.data ?? []) as Category[];
  const allProducts = productsRes.data ?? [];
  const prices = (allRangeRes.data ?? []).map(
    (p) => (p.price_grosze as number) ?? 0,
  );
  const globalMinGr = prices.length ? Math.min(...prices) : 0;
  const globalMaxGr = prices.length ? Math.max(...prices) : 50000;

  const selectedCategory = searchParams?.category ?? null;
  const searchQuery = searchParams?.q?.trim().toLowerCase() ?? "";
  const selectedMinGr = searchParams?.minPrice
    ? parseInt(searchParams.minPrice, 10) || globalMinGr
    : globalMinGr;
  const selectedMaxGr = searchParams?.maxPrice
    ? parseInt(searchParams.maxPrice, 10) || globalMaxGr
    : globalMaxGr;

  // Filtrowanie po stronie serwera. Dla kategorii rodzica włączamy też dzieci.
  const childSlugs: Set<string> = new Set();
  if (selectedCategory) {
    const parentCat = categories.find((c) => c.slug === selectedCategory);
    if (parentCat) {
      childSlugs.add(parentCat.slug);
      categories
        .filter((c) => c.parent_id === parentCat.id)
        .forEach((c) => childSlugs.add(c.slug));
    }
  }

  const products = allProducts.filter((p) => {
    const price = (p.price_grosze as number) ?? 0;
    if (price < selectedMinGr || price > selectedMaxGr) return false;
    if (selectedCategory) {
      const cat = (p.category as string | null) ?? "";
      if (!childSlugs.has(cat)) return false;
    }
    if (searchQuery && !((p.title as string) ?? "").toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  const headerLabel = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.name ?? "Sklep"
    : "Sklep";

  return (
    <>
      <header className="bg-muted">
        <div className="container mx-auto px-5 py-10 sm:px-6 lg:px-10 xl:px-12">
          <h1 className="text-3xl font-bold tracking-tight">{headerLabel}</h1>
          <p className="mt-2 text-muted-foreground">
            {selectedCategory
              ? `Produkty w kategorii: ${headerLabel}`
              : "Wszystkie produkty dostępne do personalizacji."}
          </p>
        </div>
      </header>

      <section className="container mx-auto px-5 py-10 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <ShopFilters
            categories={categories}
            globalMinGr={globalMinGr}
            globalMaxGr={globalMaxGr}
            selectedCategory={selectedCategory}
            selectedMinGr={selectedMinGr}
            selectedMaxGr={selectedMaxGr}
          />

          <div>
            {!products.length ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-muted-foreground">
                  Brak produktów spełniających wybrane kryteria.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Znaleziono {products.length} produkt
                  {products.length === 1 ? "" : products.length < 5 ? "y" : "ów"}
                </p>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {products.map((p) => {
                    const cover = (p.images as string[])?.[0];
                    return (
                      <Link
                        key={p.slug as string}
                        href={`/sklep/${p.slug}`}
                        className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary hover:shadow-md"
                      >
                        <div className="relative aspect-square bg-muted">
                          {cover ? (
                            <Image
                              src={cover}
                              alt={p.title as string}
                              fill
                              className="object-cover transition group-hover:scale-105"
                              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                              unoptimized
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-xs text-muted-foreground">
                              brak zdjęcia
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="line-clamp-2 font-semibold">
                            {p.title}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(p.price_grosze as number)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {Number(p.rating).toFixed(1)} ({p.reviews_count})
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
