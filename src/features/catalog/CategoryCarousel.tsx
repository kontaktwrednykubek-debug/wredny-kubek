"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CategoryCard = {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl: string | null;
  productsCount: number;
};

export function CategoryCarousel({ categories }: { categories: CategoryCard[] }) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  function scroll(dir: "left" | "right") {
    const el = ref.current;
    if (!el) return;
    const delta = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "left" ? -delta : delta, behavior: "smooth" });
  }

  if (!categories.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        aria-label="Poprzednie"
        className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background p-3 shadow-lg transition hover:bg-muted disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll("right")}
        aria-label="Następne"
        className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 rounded-full bg-background p-3 shadow-lg transition hover:bg-muted disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/sklep/kategoria/${c.slug}`}
            className="group relative aspect-[4/5] w-[260px] shrink-0 snap-start overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-xl sm:w-[300px]"
          >
            {c.imageUrl ? (
              <Image
                src={c.imageUrl}
                alt={c.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-110"
                sizes="(min-width: 640px) 300px, 260px"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <h3 className="text-xl font-extrabold leading-tight tracking-tight drop-shadow-md sm:text-2xl">
                {c.name}
              </h3>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-xs text-white/90 sm:text-sm">
                  {c.description}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {c.productsCount}{" "}
                  {c.productsCount === 1
                    ? "produkt"
                    : c.productsCount > 1 && c.productsCount < 5
                      ? "produkty"
                      : "produktów"}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Zobacz →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
