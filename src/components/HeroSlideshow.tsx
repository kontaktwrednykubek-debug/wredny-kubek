"use client";

import * as React from "react";
import Image from "next/image";

const SLIDES = ["/slajd-1.png", "/slajd-2.png", "/slajd-3.png"];
const INTERVAL_MS = 1200;

export function HeroSlideshow() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative aspect-square w-full">
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt="Personalizowane kubki"
          fill
          priority={i === 0}
          sizes="(min-width: 768px) 50vw, 100vw"
          className={`scale-110 object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.35)] transition-opacity duration-500 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
