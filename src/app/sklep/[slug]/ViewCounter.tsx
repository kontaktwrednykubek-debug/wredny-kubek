"use client";

import * as React from "react";

export function ViewCounter({
  productId,
}: {
  productId: string;
}) {
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Zapisz widok (z 24h blokadą per IP)
    fetch("/api/product-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => {});

    // Pobierz licznik (7-dniowe okno)
    fetch(`/api/product-view?product_id=${productId}&days=7`)
      .then((r) => r.json())
      .then((d) => {
        if (d.visible && d.count > 0) setCount(d.count);
      })
      .catch(() => {});
  }, [productId]);

  if (count === null || count <= 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-orange-500">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
      </span>
      🔥 Popularny wybór: <strong>{count}</strong> {count === 1 ? "osoba wyświetliła" : "osób wyświetliło"} ten kubek w tym tygodniu
    </div>
  );
}
