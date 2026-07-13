import * as React from "react";

/**
 * Procent obniżki (np. 43 dla 35 zł → 20 zł). Zwraca null gdy brak
 * poprawnej obniżki (sale >= base, brak sale, zerowa baza).
 */
export function salePercent(
  baseGrosze: number | null | undefined,
  saleGrosze: number | null | undefined,
): number | null {
  const base = Number(baseGrosze ?? 0);
  const sale = saleGrosze == null ? null : Number(saleGrosze);
  if (sale == null || base <= 0 || sale < 0 || sale >= base) return null;
  const pct = Math.round((1 - sale / base) * 100);
  return pct > 0 ? pct : null;
}

/**
 * Badge wyprzedaży — "słoneczko" (starburst) z procentem obniżki.
 * Renderuje się tylko gdy obniżka jest realna. Nakładaj absolutnie
 * na zdjęcie karty produktu (np. left-2 top-2).
 */
export function SaleBadge({
  percent,
  className = "",
  size = "md",
}: {
  percent: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? 48 : size === "lg" ? 80 : 60;
  const fontSize = size === "sm" ? 13 : size === "lg" ? 21 : 16;
  return (
    <span
      className={`pointer-events-none inline-grid place-items-center drop-shadow-md ${className}`}
      style={{ width: px, height: px }}
      aria-label={`Obniżka ${percent}%`}
    >
      <svg viewBox="0 0 100 100" width={px} height={px} className="[grid-area:1/1] animate-[spin_24s_linear_infinite]">
        <defs>
          <linearGradient id="saleburst" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        {/* 16-ramienna gwiazda (starburst) */}
        <polygon
          fill="url(#saleburst)"
          points={Array.from({ length: 32 }, (_, i) => {
            const r = i % 2 === 0 ? 50 : 40;
            const a = (Math.PI * i) / 16;
            return `${50 + r * Math.sin(a)},${50 - r * Math.cos(a)}`;
          }).join(" ")}
        />
      </svg>
      <span
        className="[grid-area:1/1] relative font-extrabold leading-none text-white"
        style={{ fontSize }}
      >
        -{percent}%
      </span>
    </span>
  );
}
