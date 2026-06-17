"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export type CarouselProduct = {
  slug: string;
  title: string;
  price_grosze: number;
  images: string[] | null;
  rating?: number | null;
  reviews_count?: number | null;
  variants?: unknown;
};

/** Zakres cen wariantów (np. "35 zł – 45 zł") lub jedna kwota. */
function priceLabel(base: number, variants: unknown): string {
  const cupColors = ((variants as { cupColors?: { priceGrosze?: number | null }[] } | null)
    ?.cupColors) ?? [];
  const prices = cupColors.length
    ? cupColors.map((c) => (c.priceGrosze != null ? c.priceGrosze : base))
    : [base];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`;
}

export function ProductCarousel({ products }: { products: CarouselProduct[] }) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!products?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
        Wkrótce pojawią się tu nasze produkty.
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Poprzedni produkt"
        onClick={() => scrollBy(-1)}
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 p-2 shadow-md transition hover:bg-primary hover:text-primary-foreground sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Następny produkt"
        onClick={() => scrollBy(1)}
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 p-2 shadow-md transition hover:bg-primary hover:text-primary-foreground sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        className="-mx-2 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => {
          const cover = p.images?.[0];
          return (
            <Link
              key={p.slug}
              data-card
              href={`/sklep/${p.slug}`}
              className="group flex w-[75%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary hover:shadow-lg sm:w-[45%] lg:w-[31%] xl:w-[23%]"
            >
              <div className="relative aspect-square bg-muted">
                {cover ? (
                  <Image
                    src={cover}
                    alt={p.title}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 75vw"
                    className="object-cover transition group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    brak zdjęcia
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="line-clamp-2 font-semibold">{p.title}</p>
                <div className="mt-auto flex items-start justify-between pt-3">
                  <div>
                    <span className="text-lg font-bold text-primary">
                      {priceLabel(p.price_grosze, p.variants)}
                    </span>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      w tym podatek VAT 23%
                    </p>
                  </div>
                  {p.rating != null && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(p.rating).toFixed(1)}
                      {p.reviews_count != null && ` (${p.reviews_count})`}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
