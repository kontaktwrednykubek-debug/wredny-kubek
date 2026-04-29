"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

export function ProductGalleryClient({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = React.useState(0);
  const [lightbox, setLightbox] = React.useState(false);
  const main = images[active];

  // ESC zamyka lightbox; strzałki przewijają.
  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight")
        setActive((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setActive((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, images.length]);

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => images.length && setLightbox(true)}
          className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted"
          aria-label="Powiększ zdjęcie"
        >
          {main ? (
            <>
              <Image
                src={main}
                alt={title}
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(min-width: 1024px) 50vw, 100vw"
                unoptimized
                priority
              />
              <span className="absolute right-3 top-3 rounded-full bg-background/80 p-2 opacity-0 backdrop-blur transition group-hover:opacity-100">
                <ZoomIn className="h-4 w-4" />
              </span>
            </>
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              Brak zdjęcia
            </div>
          )}
        </button>
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                aria-label={`Zdjęcie ${i + 1}`}
                className={`relative aspect-square overflow-hidden rounded-lg border bg-muted transition ${
                  i === active
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-primary/60"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX — pełnoekranowy modal */}
      {lightbox && main && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(false)}
        >
          {/* Obraz — renderowany PIERWSZY, żeby przyciski (po nim) były nad nim w stackingu */}
          <div
            className="relative h-full w-full p-4 sm:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={main}
              alt={title}
              fill
              sizes="100vw"
              unoptimized
              className="pointer-events-none object-contain"
              priority
            />
          </div>

          <button
            type="button"
            aria-label="Zamknij"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(false);
            }}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Poprzednie"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i - 1 + images.length) % images.length);
                }}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20 sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Następne"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i + 1) % images.length);
                }}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20 sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
