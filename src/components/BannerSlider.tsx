"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  image_url_mobile: string | null;
  alt_text: string | null;
  link_url: string | null;
};

const INTERVAL_MS = 5000;

export function BannerSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = banners.length;

  React.useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  const Wrapper = ({ children, banner }: { children: React.ReactNode; banner: Banner }) =>
    banner.link_url ? (
      <Link href={banner.link_url} className="block w-full h-full">
        {children}
      </Link>
    ) : (
      <div className="block w-full h-full">{children}</div>
    );

  return (
    <section
      className="relative w-full overflow-hidden bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`transition-opacity duration-700 ${i === index ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 z-0"}`}
        >
          <Wrapper banner={b}>
            <div className="relative w-full aspect-[16/5]">
              <Image
                src={b.image_url}
                alt={b.alt_text ?? b.title ?? "Baner promocyjny"}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </Wrapper>
        </div>
      ))}

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Poprzedni baner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Następny baner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`}
              aria-label={`Baner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
