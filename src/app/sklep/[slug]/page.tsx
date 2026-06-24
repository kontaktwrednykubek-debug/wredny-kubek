import Link from "next/link";
import * as React from "react";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { brand } from "@/config/theme";
import { getAdultCategorySlugs } from "@/lib/adult";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/BackLink";
import { formatPrice } from "@/lib/utils";
import { ProductGalleryClient } from "./ProductGalleryClient";
import { ProductPageClient } from "./ProductPageClient";
import { ProductRatingTrigger } from "./ProductRatingTrigger";
import { ViewCounter } from "./ViewCounter";
import { RelatedProducts } from "./RelatedProducts";
import { WrednyChatButton } from "./WrednyChatButton";
import { AgeGate } from "../AgeGate";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shop_products")
    .select("title, description, images, category, categories")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data) return { title: "Produkt" };

  // Produkty 18+ — dostępne na stronie (za bramką wieku), ale NIE w Google.
  const adultCatSlugs = await getAdultCategorySlugs(supabase);
  const cats =
    (data.categories as string[] | null) ?? [(data.category as string | null) ?? ""];
  const isAdult = cats.some((c) => adultCatSlugs.has(c));

  const images = (data.images as string[] | null) ?? [];
  const hasCover = images.length > 0;
  // Podgląd społecznościowy: JPEG 1200×630 z endpointu (Facebook/Messenger
  // bywają zawodne z WebP). Generowany tylko dla botów, cache 24h.
  const ogImage = hasCover ? `/api/og/${params.slug}` : undefined;
  // Skróć opis do ~120 znaków, by nie ucinało się w podglądach społecznościowych.
  const rawDesc = (data.description as string | null)?.trim();
  const description = rawDesc
    ? rawDesc.length > 120
      ? `${rawDesc.slice(0, 117).trimEnd()}…`
      : rawDesc
    : undefined;

  return {
    title: data.title ?? "Produkt",
    description,
    alternates: { canonical: `/sklep/${params.slug}` },
    ...(isAdult
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    openGraph: {
      type: "website",
      locale: "pl_PL",
      siteName: brand.name,
      title: data.title ?? "Produkt",
      description,
      url: `/sklep/${params.slug}`,
      // Zdjęcie produktu jako podgląd przy udostępnianiu (fallback: logo z layoutu).
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                type: "image/jpeg",
                alt: data.title ?? "Produkt",
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: data.title ?? "Produkt",
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
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
      "id, slug, title, description, body, category, categories, price_grosze, images, specs, variants, rating, reviews_count, show_variant_stock, variant_stock, show_view_counter, view_count_base",
    )
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!product) notFound();

  // Bramka 18+: jeśli produkt należy do JAKIEJKOLWIEK kategorii dla dorosłych
  // (flaga is_adult lub nazwa/slug 18/wulgar/doros) — pokaż klauzulę wieku.
  const prodCats =
    (product.categories as string[] | null) ??
    [(product.category as string | null) ?? ""].filter(Boolean);
  const { data: adultCatsData } = await supabase
    .from("categories")
    .select("slug, name, is_adult");
  const adultSlugs = new Set(
    (adultCatsData ?? [])
      .filter(
        (c) =>
          c.is_adult === true ||
          /18\+?|wulgar|doros/i.test(`${c.slug ?? ""} ${c.name ?? ""}`),
      )
      .map((c) => c.slug as string),
  );
  const isAdultProduct = prodCats.some((c) => adultSlugs.has(c));

  const images = (product.images as string[]) ?? [];
  const specs = (product.specs as Record<string, string>) ?? {};
  // Tabelka „Dane techniczne" pokazuje tylko własne parametry z wartością.
  // „Stan" i „Ilość" to dane wewnętrzne (stan magazynowy) — nie dla klienta.
  const HIDDEN_SPECS = ["Stan", "Ilość"];
  const specEntries = Object.entries(specs).filter(
    ([k, v]) => !HIDDEN_SPECS.includes(k) && String(v ?? "").trim() !== "",
  );
  const variants = (product.variants as Variants) ?? {};
  const rating = Number(product.rating ?? 0);
  const body = (product.body as string | null) ?? null;
  const showVariantStock = Boolean(product.show_variant_stock);
  // Stan bazowy (pole „Ilość") — używany dla produktów bez wariantów.
  const parsedBaseStock = parseInt(specs["Ilość"] ?? "", 10);
  const baseStock = Number.isFinite(parsedBaseStock) ? parsedBaseStock : null;
  // Per-product stock map (zapisany w variant_stock JSONB)
  const variantStockMap: Record<string, number> =
    (product.variant_stock as Record<string, number>) ?? {};

  return (
    <section className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 mx-4 sm:mx-0">
      {isAdultProduct && <AgeGate categorySlug={product.slug} />}
      <BackLink href="/sklep" label="Wróć do sklepu" />

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
        {/* Lewa kolumna: tylko galeria */}
        <div className="order-1">
          <ProductGalleryClient images={images} title={product.title} />
        </div>

        {/* Prawa kolumna (mobile: pod galerią): tytuł → opinie → cena → warianty/kup → opis → dane techniczne */}
        <div className="order-2 flex flex-col gap-4 sm:gap-5">
          {/* Tytuł + opinie */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {product.title}
            </h1>
            <ProductRatingTrigger
              productSlug={product.slug}
              productTitle={product.title}
              rating={rating}
              reviewsCount={product.reviews_count ?? 0}
            />
          </div>

          {/* Licznik popularności */}
          {product.show_view_counter && (
            <ViewCounter productId={product.id} />
          )}

          {/* Cena — tylko dla merch (personalizacja). Dla produktów z wariantami
              cenę pokazuje BuyNowSection (zmienia się z wybranym kolorem). */}
          {product.category === "merch" && (
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              {formatPrice(product.price_grosze)}
            </p>
          )}

          {/* Krótki opis */}
          {product.description && (
            <p className="whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Warianty + kup teraz */}
          {product.category === "merch" ? (
            <div className="space-y-3 rounded-xl sm:rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
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
            <React.Suspense fallback={null}>
              <ProductPageClient
                slug={product.slug}
                title={product.title}
                priceGrosze={product.price_grosze}
                cover={images[0] ?? null}
                variants={variants}
                showVariantStock={showVariantStock}
                variantStockMap={variantStockMap}
                baseStock={baseStock}
              />
            </React.Suspense>
          )}

          {/* Wredny AI — pod przyciskami zakupu */}
          <div className="flex flex-col gap-3 mt-[30px]">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Coś Cię gryzie? Dopytaj o co chcesz, ten czat i tak nigdzie się nie zapisuje.
            </p>
            <WrednyChatButton />
          </div>

        </div>
      </div>

      {/* Dane techniczne + opis — pełna szerokość pod galerią i sekcją zakupu */}
      {(body || specEntries.length > 0) && (
        <div className="mt-6 lg:mt-8 flex flex-col gap-4 sm:gap-5">
          {specEntries.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Dane techniczne
              </h2>
              <dl className="grid gap-2 text-sm">
                {specEntries.map(([k, v]) => (
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

          {body && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Opis produktu
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{body}</p>
            </div>
          )}
        </div>
      )}

      {/* Powiązane produkty */}
      <RelatedProducts slug={params.slug} />
    </section>
  );
}
