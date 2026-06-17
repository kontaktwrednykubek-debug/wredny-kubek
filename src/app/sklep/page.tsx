import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ShopFilters, type Category } from "./ShopFilters";
import { WishlistButton } from "@/components/WishlistButton";

/**
 * Etykieta ceny na kafelku: zakres od najtańszego do najdroższego wariantu
 * (np. "35 zł – 45 zł"). Gdy wszystkie ceny równe → jedna kwota.
 */
function priceLabel(base: number, variants: unknown): string {
  const cupColors = ((variants as { cupColors?: { priceGrosze?: number | null }[] } | null)
    ?.cupColors) ?? [];
  const prices = cupColors.length
    ? cupColors.map((c) => (c.priceGrosze != null ? c.priceGrosze : base))
    : [base];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { category?: string };
}): Promise<import("next").Metadata> {
  if (!searchParams?.category) return { title: "Sklep" };
  const supabase = createSupabaseServerClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("name, description, meta_description, image_url")
    .eq("slug", searchParams.category)
    .maybeSingle();
  if (!cat) return { title: "Sklep" };
  const desc = (cat.meta_description as string | null) || (cat.description as string | null) || undefined;
  const imgUrl = cat.image_url as string | null;
  return {
    title: `${cat.name as string} | Sklep`,
    description: desc,
    openGraph: {
      title: `${cat.name as string} | Sklep`,
      description: desc,
      images: imgUrl ? [imgUrl] : undefined,
    },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: { category?: string; minPrice?: string; maxPrice?: string; q?: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [categoriesRes, allRangeRes, productsRes, wishlistRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, description, long_description, image_url, parent_id, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("shop_products")
      .select("price_grosze")
      .eq("is_published", true),
    supabase
      .from("shop_products")
      .select(
        "slug, title, price_grosze, images, rating, reviews_count, category, variants",
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    user
      ? supabase.from("wishlists").select("product_slug").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const savedSlugs = new Set((wishlistRes.data ?? []).map((w: { product_slug: string }) => w.product_slug));
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

  type CatWithDesc = Category & { description?: string | null; long_description?: string | null; image_url?: string | null };
  const selectedCat = selectedCategory
    ? (categories as CatWithDesc[]).find((c) => c.slug === selectedCategory) ?? null
    : null;
  const headerLabel = selectedCat?.name ?? (selectedCategory ? selectedCategory : "Sklep");
  const shortDesc = selectedCat?.description ?? null;
  const longDesc = selectedCat?.long_description ?? null;

  return (
    <>
      <header className="bg-muted">
        <div className="container mx-auto px-5 py-10 sm:px-6 lg:px-10 xl:px-12">
          <h1 className="text-3xl font-bold tracking-tight">{headerLabel}</h1>
          <p className="mt-2 text-muted-foreground">
            {shortDesc ||
              (selectedCategory
                ? `Produkty w kategorii: ${headerLabel}`
                : "Wszystkie produkty dostępne do personalizacji.")}
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
                        <div className="relative aspect-square bg-muted group/card">
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
                          <div className="absolute right-2 top-2">
                            <WishlistButton slug={p.slug as string} initialSaved={savedSlugs.has(p.slug as string)} />
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="line-clamp-2 font-semibold">
                            {p.title}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              {priceLabel(p.price_grosze as number, p.variants)}
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

            {longDesc && (
              <div className="mt-12 border-t border-border pt-8">
                <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
                  {longDesc.split("\n\n").map((para, i) => (
                    <p key={i} className="mb-4 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
