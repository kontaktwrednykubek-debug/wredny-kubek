"use client";

import * as React from "react";
import { Truck } from "lucide-react";
import { useCart, cartTotalGr } from "@/features/cart/useCart";
import { formatPrice } from "@/lib/utils";

// Próg pobierany raz na wizytę i współdzielony przez wszystkie instancje paska.
let thresholdPromise: Promise<number | null> | null = null;

/**
 * Najniższy próg darmowej dostawy wśród aktywnych metod krajowych
 * (panel → Dostawa → „Darmowa wysyłka od”). null = brak progu.
 */
function loadThreshold(): Promise<number | null> {
  thresholdPromise ??= fetch("/api/shipping-methods")
    .then((r) => (r.ok ? r.json() : { methods: [] }))
    .then((j: { methods?: { is_active?: boolean; free_shipping_threshold_grosze?: number | null }[] }) => {
      const values = (j.methods ?? [])
        .filter((m) => m.is_active && m.free_shipping_threshold_grosze != null)
        .map((m) => m.free_shipping_threshold_grosze as number);
      return values.length ? Math.min(...values) : null;
    })
    .catch(() => null);
  return thresholdPromise;
}

/**
 * „Do darmowej dostawy brakuje jeszcze X zł” + pasek postępu.
 * Liczy wartość produktów w koszyku bez dostawy — tak samo jak checkout i serwer.
 */
export function FreeShippingProgress({ className = "" }: { className?: string }) {
  const items = useCart((s) => s.items);
  const [threshold, setThreshold] = React.useState<number | null>(null);
  // Koszyk jest w localStorage — przed hydracją nie znamy sumy, więc nic nie pokazujemy.
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    void loadThreshold().then(setThreshold);
  }, []);

  if (!mounted || threshold == null || items.length === 0) return null;

  const total = cartTotalGr(items);
  const missing = threshold - total;
  const reached = missing <= 0;
  const percent = Math.min(100, Math.round((total / threshold) * 100));

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        reached
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-primary/20 bg-primary/5"
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="flex items-center gap-2 text-sm">
        <Truck className={`h-4 w-4 shrink-0 ${reached ? "text-emerald-600" : "text-primary"}`} />
        {reached ? (
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            Masz darmową dostawę! 🎉
          </span>
        ) : (
          <span>
            Do <strong>darmowej dostawy</strong> brakuje Ci jeszcze{" "}
            <strong className="text-primary">{formatPrice(missing)}</strong>
          </span>
        )}
      </p>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Postęp do darmowej dostawy"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            reached ? "bg-emerald-500" : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!reached && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Darmowa dostawa od {formatPrice(threshold)} (bez kosztów przesyłki, dostawa w Polsce).
        </p>
      )}
    </div>
  );
}
