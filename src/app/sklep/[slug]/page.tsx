import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/BackLink";
import { formatPrice } from "@/lib/utils";
import { ProductGalleryClient } from "./ProductGalleryClient";
import { BuyNowSection } from "./BuyNowSection";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shop_products")
    .select("title")
    .eq("slug", params.slug)
    .maybeSingle();
  return { title: data?.title ?? "Produkt" };
}

type Variants = {
  colors?: { name: string; hex: string }[];
  cupColors?: { id: string; name: string; imageUrl: string }[];
  capacities?: string[];
  sizes?: string[];
};

export default async function ProductDetailsPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase
    .from("shop_products")
    .select(
      "slug, title, description, body, category, price_grosze, images, specs, variants, rating, reviews_count, show_variant_stock, variant_stock",
    )
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!product) notFound();

  const images = (product.images as string[]) ?? [];
  const specs = (product.specs as Record<string, string>) ?? {};
  const variants = (product.variants as Variants) ?? {};
  const rating = Number(product.rating ?? 0);
  const body = (product.body as string | null) ?? null;
  const showVariantStock = Boolean(product.show_variant_stock);
  // Per-product stock map (zapisany w variant_stock JSONB)
  const variantStockMap: Record<string, number> =
    (product.variant_stock as Record<string, number>) ?? {};

  return (
    <section className="container mx-auto max-w-6xl px-4 py-8">
      <BackLink href="/sklep" label="Wróć do sklepu" />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Lewa kolumna: tylko galeria */}
        <div>
          <ProductGalleryClient images={images} title={product.title} />
        </div>

        {/* Prawa kolumna (mobile: pod galerią): tytuł → opinie → cena → warianty/kup → opis → dane techniczne */}
        <div className="flex flex-col gap-5">
          {/* Tytuł + opinie */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {product.title}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      n <= Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {rating.toFixed(1)} · {product.reviews_count} opinii
              </span>
            </div>
          </div>

          {/* Cena */}
          <p className="text-3xl font-bold text-primary">
            {formatPrice(product.price_grosze)}
          </p>

          {/* Krótki opis */}
          {product.description && (
            <p className="whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Warianty + kup teraz */}
          {product.category === "merch" ? (
            <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">Produkt do personalizacji</p>
                  <p className="text-sm text-muted-foreground">
                    Otwórz edytor, dodaj swój nadruk lub tekst i zamów gotowy
                    egzemplarz.
                  </p>
                </div>
              </div>
              <Link href="/edytor?productId=mug&lock=1" className="block">
                <Button size="lg" className="w-full">
                  <Sparkles className="h-4 w-4" />
                  Personalizuj kubek
                </Button>
              </Link>
            </div>
          ) : (
            <BuyNowSection
              slug={product.slug}
              title={product.title}
              priceGrosze={product.price_grosze}
              cover={images[0] ?? null}
              variants={variants}
              showVariantStock={showVariantStock}
              variantStockMap={variantStockMap}
            />
          )}

          {/* Długi opis produktu */}
          {body && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Opis produktu
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{body}</p>
            </div>
          )}

          {/* Dane techniczne */}
          {Object.keys(specs).length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Dane techniczne
              </h2>
              <dl className="grid gap-2 text-sm">
                {Object.entries(specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-3 border-b border-border/50 py-1.5 last:border-b-0"
                  >
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
