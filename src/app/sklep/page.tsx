import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Sklep" };

export default async function ShopPage() {
  const supabase = createSupabaseServerClient();
  const { data: products } = await supabase
    .from("shop_products")
    .select(
      "slug, title, price_grosze, images, rating, reviews_count",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <header className="bg-muted">
        <div className="container mx-auto px-5 py-10 sm:px-6 lg:px-10 xl:px-12">
          <h1 className="text-3xl font-bold tracking-tight">Sklep</h1>
          <p className="mt-2 text-muted-foreground">
            Wszystkie produkty dostępne do personalizacji.
          </p>
        </div>
      </header>

      <section className="container mx-auto px-5 py-10 sm:px-6 lg:px-10 xl:px-12">
        {!products?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              Wkrótce pojawią się tu nasze produkty.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => {
              const cover = (p.images as string[])?.[0];
              return (
                <Link
                  key={p.slug}
                  href={`/sklep/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary hover:shadow-md"
                >
                  <div className="relative aspect-square bg-muted">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={p.title}
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
                    <p className="line-clamp-2 font-semibold">{p.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(p.price_grosze)}
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
        )}
      </section>
    </>
  );
}
