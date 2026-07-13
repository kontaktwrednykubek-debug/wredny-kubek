import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { SaleBadge, salePercent } from "@/components/SaleBadge";
import { getAdultCategorySlugs } from "@/lib/adult";

export const metadata: Metadata = {
  title: "Wyprzedaż — kubki w obniżonych cenach",
  description:
    "Wredne kubki w jeszcze wredniejszych cenach. Obniżki do wyczerpania zapasów — kto pierwszy, ten pije taniej.",
  alternates: { canonical: "/wyprzedaz" },
};

export const revalidate = 60;

export default async function SalePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shop_products")
    .select(
      "slug, title, price_grosze, sale_price_grosze, images, rating, reviews_count, category, categories",
    )
    .eq("is_published", true)
    .not("sale_price_grosze", "is", null)
    .order("created_at", { ascending: false });

  // Bez 18+ i tylko realne obniżki.
  const adultCatSlugs = await getAdultCategorySlugs(supabase);
  const products = (data ?? []).filter((p) => {
    const cats =
      (p.categories as string[] | null) ?? [(p.category as string | null) ?? ""];
    if (cats.some((c) => adultCatSlugs.has(c))) return false;
    return (p.sale_price_grosze as number) < (p.price_grosze as number);
  });

  return (
    <>
      <header className="relative overflow-hidden border-b border-rose-500/20 bg-gradient-to-b from-rose-500/10 to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[32rem] -translate-x-1/2 rounded-full bg-rose-500/15 blur-3xl"
        />
        <div className="container relative mx-auto px-5 py-12 text-center sm:px-6 md:py-16 lg:px-10 xl:px-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow">
            🔻 Wyprzedaż
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Ceny spadły. Wredność została.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Obniżki obowiązują do wyczerpania zapasów — a zapasy to dokładnie
            to, co widzisz poniżej. Kto pierwszy, ten pije taniej.
          </p>
        </div>
      </header>

      <section className="container mx-auto px-5 py-10 sm:px-6 lg:px-10 xl:px-12">
        {!products.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-lg font-semibold">
              Wszystko rozeszło się na pniu. 🫣
            </p>
            <p className="mt-2 text-muted-foreground">
              Aktualnie nic nie jest przecenione — ale wpadnij za jakiś czas,
              wredne okazje lubią wracać.
            </p>
            <Link
              href="/sklep"
              className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline"
            >
              Zobacz pełny sklep →
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {products.length} produkt
              {products.length === 1 ? "" : products.length < 5 ? "y" : "ów"} w
              obniżonej cenie
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => {
                const cover = (p.images as string[])?.[0];
                const pct = salePercent(
                  p.price_grosze as number,
                  p.sale_price_grosze as number,
                )!;
                return (
                  <Link
                    key={p.slug as string}
                    href={`/sklep/${p.slug}`}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-rose-500/60 hover:shadow-md"
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
                      <SaleBadge percent={pct} className="absolute left-2 top-2" />
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 font-semibold">{p.title}</p>
                      <div className="mt-2 flex items-start justify-between">
                        <span className="flex flex-col">
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(p.price_grosze as number)}
                          </span>
                          <span className="text-lg font-bold text-rose-600">
                            {formatPrice(p.sale_price_grosze as number)}
                          </span>
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
      </section>
    </>
  );
}
