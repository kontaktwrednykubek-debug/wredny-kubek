"use client";

import * as React from "react";

function formatCount(n: number): string {
  if (n >= 1000) return `Ponad ${Math.floor(n / 100) * 100}`;
  if (n >= 100) return `Ponad ${Math.floor(n / 10) * 10}`;
  return String(n);
}

function pluralOsob(n: number): string {
  if (n === 1) return "osoba wyświetliła";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "osoby wyświetliły";
  return "osób wyświetliło";
}

export function ViewCounter({ productId }: { productId: string }) {
  const [state, setState] = React.useState<{ count: number; period: number } | null>(null);

  React.useEffect(() => {
    fetch("/api/product-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => {});

    fetch(`/api/product-view?product_id=${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.visible && d.count > 0) setState({ count: d.count, period: d.period ?? 7 });
      })
      .catch(() => {});
  }, [productId]);

  if (!state) return null;

  const { count, period } = state;
  const label = formatCount(count);
  const plural = pluralOsob(count);
  const periodLabel = period <= 7 ? "w ciągu ostatnich 7 dni" : "";
  const icon = period <= 7 ? "🔥" : "👀";
  const prefix = period <= 7 ? "Popularny wybór:" : "W tym miesiącu:";

  return (
    <div className="flex items-start gap-2 rounded-xl bg-orange-500/10 px-3 py-2 text-sm text-orange-600 dark:text-orange-400">
      <span className="relative mt-[5px] flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
      </span>
      <span>
        {icon} {prefix} <strong className="font-semibold">{label} {plural}</strong> ten kubek{periodLabel ? ` ${periodLabel}` : ""}.
      </span>
    </div>
  );
}
