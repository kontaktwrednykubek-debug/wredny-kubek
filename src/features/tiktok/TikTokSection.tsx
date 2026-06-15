"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X, ShoppingBag, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

type TikTokProduct = {
  slug: string;
  title: string;
  price_grosze: number;
  images: string[] | null;
};

type TikTokItem = {
  id: string;
  videoId: string;
  thumbnailUrl: string | null;
  title: string | null;
  author: string | null;
  products: TikTokProduct[];
};

export function TikTokSection() {
  const [items, setItems] = React.useState<TikTokItem[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [active, setActive] = React.useState<TikTokItem | null>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/tiktoks", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.tiktoks ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  // Nie pokazuj sekcji wcale, gdy brak filmów
  if (!loaded || items.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 py-14 sm:px-6 md:py-20 lg:px-10 xl:px-12">
        <div className="mb-8 flex flex-col items-start gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Music2 className="h-3.5 w-3.5" /> TikTok
            </span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Zobacz nas na TikToku
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Nasze kubki w akcji — kliknij, obejrzyj film i kup prosto z nagrania.
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Poprzedni film"
            onClick={() => scrollBy(-1)}
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 p-2 shadow-md transition hover:bg-primary hover:text-primary-foreground sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Następny film"
            onClick={() => scrollBy(1)}
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 p-2 shadow-md transition hover:bg-primary hover:text-primary-foreground sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={trackRef}
            className="-mx-2 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((t) => (
              <button
                key={t.id}
                data-card
                type="button"
                onClick={() => setActive(t)}
                className="group relative flex w-[60%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:border-primary hover:shadow-lg sm:w-[38%] lg:w-[24%] xl:w-[19%]"
              >
                {/* TikTok = pionowy format 9:16 */}
                <div className="relative aspect-[9/16] bg-muted">
                  {t.thumbnailUrl ? (
                    <Image
                      src={t.thumbnailUrl}
                      alt={t.title ?? "TikTok"}
                      fill
                      sizes="(min-width: 1280px) 19vw, (min-width: 1024px) 24vw, (min-width: 640px) 38vw, 60vw"
                      className="object-cover transition group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                      brak okładki
                    </div>
                  )}
                  {/* Przyciemnienie + play */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 via-transparent to-transparent transition group-hover:from-black/60">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-110">
                      <Play className="h-6 w-6 translate-x-0.5 fill-black" />
                    </span>
                  </div>
                  {t.products.length > 0 && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                      <ShoppingBag className="h-3 w-3" />
                      {t.products.length}
                    </span>
                  )}
                </div>
                {(t.title || t.author) && (
                  <div className="p-3">
                    {t.author && (
                      <p className="text-xs font-semibold text-primary">@{t.author}</p>
                    )}
                    {t.title && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{t.title}</p>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {active && <TikTokModal item={active} onClose={() => setActive(null)} />}
    </section>
  );
}

function TikTokModal({ item, onClose }: { item: TikTokItem; onClose: () => void }) {
  // Blokuj scroll tła + zamykanie Escape
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-0 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-card shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pasek górny z zamknięciem */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Music2 className="h-4 w-4 text-primary" />
            {item.author ? `@${item.author}` : "TikTok"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Odtwarzacz — gra wewnątrz sklepu, klient nigdzie nie wychodzi */}
        <div className="relative flex-1 overflow-y-auto">
          <div className="relative mx-auto aspect-[9/16] w-full bg-black">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${item.videoId}`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={item.title ?? "TikTok"}
            />
          </div>

          {/* Powiązane produkty + "Kup" */}
          {item.products.length > 0 && (
            <div className="space-y-2 border-t border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.products.length === 1 ? "Produkt z filmu" : "Produkty z filmu"}
              </p>
              {item.products.map((p) => {
                const cover = p.images?.[0];
                return (
                  <div
                    key={p.slug}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-background p-2.5"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {cover ? (
                        <Image src={cover} alt={p.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
                          brak
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold">{p.title}</p>
                      <p className="text-sm font-bold text-primary">
                        {formatPrice(p.price_grosze)}
                      </p>
                    </div>
                    <Link href={`/sklep/${p.slug}`} onClick={onClose}>
                      <Button size="sm" className="gap-1.5 shrink-0">
                        <ShoppingBag className="h-4 w-4" />
                        Kup
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
