"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/useCart";

type Variants = {
  colors?: { name: string; hex: string }[];
  cupColors?: { id: string; name: string; imageUrl: string }[];
  capacities?: string[];
  sizes?: string[];
};

export function BuyNowSection({
  slug,
  title,
  priceGrosze,
  cover,
  variants,
  showVariantStock = false,
  variantStockMap = {},
}: {
  slug: string;
  title: string;
  priceGrosze: number;
  cover: string | null;
  variants: Variants;
  showVariantStock?: boolean;
  variantStockMap?: Record<string, number>;
}) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const colors = variants.colors ?? [];
  const cupColors = variants.cupColors ?? [];
  const capacities = variants.capacities ?? [];
  const sizes = variants.sizes ?? [];

  const [color, setColor] = React.useState<string | null>(
    cupColors[0]?.id ?? colors[0]?.name ?? null,
  );
  const [capacity, setCapacity] = React.useState<string | null>(capacities[0] ?? null);
  const [size, setSize] = React.useState<string | null>(sizes[0] ?? null);
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  // Maksymalna dostępna ilość dla wybranego koloru (tylko gdy showVariantStock)
  const maxQty = React.useMemo(() => {
    if (!showVariantStock || !color) return 999;
    const s = variantStockMap[color];
    return typeof s === "number" ? Math.max(0, s) : 999;
  }, [showVariantStock, color, variantStockMap]);

  // Gdy zmieniony kolor → przytnij qty do nowego limitu
  React.useEffect(() => {
    setQty((q) => Math.min(q, Math.max(1, maxQty)));
  }, [maxQty]);

  function buildLabel(): string {
    const parts: string[] = [title];
    if (color) {
      const cupC = cupColors.find((c) => c.id === color);
      parts.push(cupC?.name ?? color);
    }
    if (capacity) parts.push(capacity);
    if (size) parts.push(size);
    return parts.join(" · ");
  }

  function addToCart(redirect: boolean) {
    add({
      designId: null,
      productId: `shop:${slug}`,
      unitPriceGr: priceGrosze,
      previewUrl: cover ?? undefined,
      label: buildLabel(),
      quantity: qty,
      maxQty: maxQty < 999 ? maxQty : undefined,
      variant: {
        color: color ?? undefined,
        size: size ?? undefined,
      },
    });
    if (redirect) router.push("/koszyk");
    else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Kolory kubka z obrazkami */}
      {cupColors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Kolor:{" "}
            <span className="text-muted-foreground">
              {cupColors.find((c) => c.id === color)?.name ?? ""}
            </span>
            {showVariantStock && color && (() => {
              const s = variantStockMap[color];
              if (s === undefined) return null;
              return (
                <span className={`ml-2 text-xs font-normal ${
                  s === 0 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {s === 0 ? "— brak na stanie" : `— ${s} szt. dostępnych`}
                </span>
              );
            })()}
          </p>
          <div className="flex flex-wrap gap-3">
            {cupColors.map((c) => {
              const stock = variantStockMap[c.id];
              const outOfStock = showVariantStock && stock === 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  aria-label={c.name}
                  title={outOfStock ? `${c.name} — brak na stanie` : c.name}
                  disabled={outOfStock}
                  className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                    outOfStock
                      ? "cursor-not-allowed border-border opacity-40"
                      : color === c.id
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  {c.imageUrl ? (
                    <Image src={c.imageUrl} alt={c.name} fill className="object-cover" unoptimized />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">{c.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stare hex-kolory (backward compat) */}
      {cupColors.length === 0 && colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Kolor: <span className="text-muted-foreground">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                aria-label={c.name}
                title={c.name}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  color === c.name
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/60"
                }`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pojemność kubka */}
      {capacities.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Pojemność</p>
          <div className="flex flex-wrap gap-2">
            {capacities.map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => setCapacity(cap)}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${
                  capacity === cap
                    ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/60"
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Rozmiar</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  size === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">
          Ilość
          {showVariantStock && maxQty < 999 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (max {maxQty} szt.)
            </span>
          )}
        </p>
        <div className="inline-flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-lg hover:bg-muted"
            aria-label="Mniej"
          >
            −
          </button>
          <span className="min-w-[3ch] px-2 text-center font-medium">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            className="px-3 py-2 text-lg hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Więcej"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button size="lg" className="flex-1" onClick={() => addToCart(true)}>
          <ShoppingCart className="h-4 w-4" />
          Kup teraz
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => addToCart(false)}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" />
              Dodano
            </>
          ) : (
            "Dodaj do koszyka"
          )}
        </Button>
      </div>
    </div>
  );
}
