import Link from "next/link";
import { Plus, Star, Trash2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ProductsAdminActions } from "./ProductsAdminActions";

export const metadata = { title: "Produkty" };

export default async function AdminProductsPage({
  params,
}: {
  params: { adminSlug: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: products } = await supabase
    .from("shop_products")
    .select(
      "id, slug, title, description, price_grosze, images, rating, reviews_count, is_published",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produkty</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gotowe produkty wystawione w sklepie. Edytor personalizacji używa
            osobnej konfiguracji.
          </p>
        </div>
        <Link href={`/${params.adminSlug}/produkty/nowy`}>
          <Button>
            <Plus className="h-4 w-4" />
            Dodaj produkt
          </Button>
        </Link>
      </div>

      {!products?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">
            Brak produktów. Dodaj pierwszy, aby pojawił się w sklepie.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const cover = (p.images as string[])?.[0];
            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary"
              >
                <Link
                  href={`/sklep/${p.slug}`}
                  className="block"
                  target="_blank"
                >
                  <div className="aspect-square bg-muted">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted-foreground">
                        brak zdjęcia
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    /{p.slug}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-primary">
                      {formatPrice(p.price_grosze)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(p.rating).toFixed(1)} ({p.reviews_count})
                    </span>
                  </div>
                  <ProductsAdminActions slug={p.slug} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
