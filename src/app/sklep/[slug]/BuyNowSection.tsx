"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/useCart";
import { formatPrice } from "@/lib/utils";

type Variant = {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  stockCount: number;
  priceGrosze?: number | null; // cena custom wariantu; null = cena bazowa
  materials?: string[]; // specyfikacja: z czego wykonany
  extraInfo?: string[]; // specyfikacja: informacje dodatkowe
};

export function BuyNowSection({
  slug,
  title,
  priceGrosze,
  cover,
  showVariantStock,
  capacities = [],
  baseStock = null,
}: {
  slug: string;
  title: string;
  priceGrosze: number;
  cover: string | null;
  showVariantStock: boolean;
  capacities?: string[];
  baseStock?: number | null;
}) {
  const router = useRouter();
  const add = useCart((state) => state.add);
  const [variants, setVariants] = React.useState<Variant[]>([]);
  const [color, setColor] = React.useState<string | null>(null);
  const [capacity, setCapacity] = React.useState<string | null>(capacities[0] ?? null);
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch variants from API
  const fetchVariants = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/shop-products/${slug}/variants`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
        // Auto-select first variant
        if (data.variants?.length > 0 && !color) {
          setColor(data.variants[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch variants:", err);
    } finally {
      setIsLoading(false);
    }
  }, [slug, color]);

  React.useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);
  
  // Listen for variants refresh event
  React.useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      console.log(`[BuyNowSection] Got refresh event for slug:`, event.detail.slug, `current slug:`, slug);
      if (event.detail.slug === slug) {
        console.log(`[BuyNowSection] Refreshing variants for ${slug}`);
        fetchVariants();
      }
    };
    
    window.addEventListener('variants-refresh', handleRefresh as EventListener);
    console.log(`[BuyNowSection] Added event listener for ${slug}`);
    return () => {
      console.log(`[BuyNowSection] Removed event listener for ${slug}`);
      window.removeEventListener('variants-refresh', handleRefresh as EventListener);
    };
  }, [slug, fetchVariants]);
  
  // Czy produkt w ogóle ma warianty kolorów. Bez nich kupujemy bez wyboru koloru.
  const hasColorVariants = variants.length > 0;

  // maxQty ZAWSZE limituje zakup do dostępnego stanu. Dla produktu bez wariantów
  // stanem jest baseStock (pole „Ilość"); null = brak limitu.
  const maxQty = hasColorVariants
    ? (color ? (variants.find((v) => v.id === color)?.stockCount ?? 999) : 999)
    : (baseStock ?? 999);

  // Produkt bez wariantów wyprzedany, gdy stan bazowy = 0.
  const isSoldOut = !hasColorVariants && baseStock === 0;
  // Mało sztuk (1–5) dla produktu bez wariantów — pokazujemy zachętę.
  const lowStock =
    !hasColorVariants && baseStock != null && baseStock > 0 && baseStock <= 5
      ? baseStock
      : null;

  // Cena zależna od wybranego koloru — wariant może mieć cenę custom, inaczej cena bazowa.
  const selectedVariant = variants.find((v) => v.id === color);
  const effectivePriceGr =
    selectedVariant?.priceGrosze != null ? selectedVariant.priceGrosze : priceGrosze;

  const buildLabel = () => {
    const variant = variants.find(v => v.id === color);
    const parts: string[] = [title];
    if (variant) parts.push(variant.name);
    if (capacity) parts.push(capacity);
    return parts.join(" - ");
  };

  const handleAdd = (redirect = false) => {
    if (maxQty < 1) return;
    // Produkt z kolorami wymaga wyboru koloru; produkt bez wariantów — nie.
    const variant = hasColorVariants ? variants.find((v) => v.id === color) : null;
    if (hasColorVariants && !variant) return;

    // Don't set maxQty - always fetch from database to prevent race conditions
    add({
      designId: null,
      productId: `shop:${slug}`,
      unitPriceGr: effectivePriceGr,
      previewUrl: cover ?? undefined,
      label: buildLabel(),
      quantity: qty,
      variant: variant ? { color: variant.id } : undefined,
    });
    if (redirect) router.push("/koszyk");
    else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pojemność */}
      {capacities.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Pojemność:{" "}
            <span className="text-muted-foreground">{capacity ?? ""}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {capacities.map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => setCapacity(cap)}
                className={`rounded-lg border-2 px-3.5 py-2 text-sm font-medium transition-all ${
                  capacity === cap
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kolory kubka z obrazkami */}
      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Kolor:{" "}
            <span className="text-muted-foreground">
              {variants.find((c) => c.id === color)?.name ?? ""}
            </span>
            {showVariantStock && color && (() => {
              const variant = variants.find(v => v.id === color);
              if (!variant) return null;
              return (
                <span className={`ml-2 text-xs font-normal ${
                  variant.stockCount === 0 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {variant.stockCount === 0 ? "— brak na stanie" : `— ${variant.stockCount} szt. dostępnych`}
                </span>
              );
            })()}
          </p>
          <div className="flex flex-wrap gap-3">
            {variants.map((c) => {
              const stock = c.stockCount;
              // ZAWSZE wyłącz przycisk gdy brak na stanie (niezależnie od showVariantStock)
              const isDisabled = stock === 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setColor(c.id)}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    color === c.id
                      ? "border-primary ring-2 ring-primary/20"
                      : isDisabled
                      ? "border-muted bg-muted cursor-not-allowed opacity-50"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16">
                    <Image
                      src={c.imageUrl}
                      alt={c.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 48px, 64px"
                    />
                    {isDisabled && (
                      <div className="absolute inset-0 bg-muted/60 flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {color === c.id && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Specyfikacja wybranego koloru — zmienia się wraz z wariantem */}
      {selectedVariant &&
        ((selectedVariant.materials?.length ?? 0) > 0 ||
          (selectedVariant.extraInfo?.length ?? 0) > 0) && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-semibold">Specyfikacja produktu</p>
            <dl className="space-y-2 text-sm">
              {(selectedVariant.materials?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <dt className="shrink-0 font-medium text-muted-foreground sm:w-40">
                    Materiał wykonania
                  </dt>
                  <dd className="text-foreground">
                    {selectedVariant.materials!.join(", ")}
                  </dd>
                </div>
              )}
              {(selectedVariant.extraInfo?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <dt className="shrink-0 font-medium text-muted-foreground sm:w-40">
                    Informacje dodatkowe
                  </dt>
                  <dd className="text-foreground">
                    {selectedVariant.extraInfo!.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

      {/* Ilość */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Ilość:</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={qty <= 1}
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50"
          >
            -
          </button>
          <span className="w-12 text-center font-medium">{qty}</span>
          <button
            type="button"
            disabled={qty >= maxQty}
            onClick={() => setQty(Math.min(maxQty, qty + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50"
          >
            +
          </button>
          {showVariantStock && maxQty < 999 && (
            <span className="text-xs text-muted-foreground">
              (max: {maxQty} szt.)
            </span>
          )}
        </div>
      </div>

      {/* Cena (aktualizuje się przy wyborze koloru) */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-primary">
          {formatPrice(effectivePriceGr)}
        </span>
        {selectedVariant?.priceGrosze != null && selectedVariant.priceGrosze !== priceGrosze && (
          <span className="text-sm text-muted-foreground">
            (kolor: {selectedVariant.name})
          </span>
        )}
      </div>

      {/* Mało sztuk — zachęta do szybkiego zakupu */}
      {lowStock != null && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
          <Package className="h-4 w-4 shrink-0" />
          {lowStock === 1
            ? "Ostatnia sztuka — albo teraz, albo nigdy! 🔥"
            : `Zostały tylko ${lowStock} szt. — ktoś już sięga po swój kubek… ⏳`}
        </p>
      )}

      {/* Wyprzedane — blokujemy zakup i pokazujemy „wredny", ale miły komunikat */}
      {isSoldOut ? (
        <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-5 text-center">
          <p className="text-base font-extrabold text-primary">
            Tak nas polubili, że nas wykupili! 🫣
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ten kubek właśnie zniknął z półki — ktoś był szybszy.{" "}
            <a href="/kontakt" className="font-semibold text-primary underline underline-offset-2">
              Napisz do nas
            </a>
            , a damy znać, gdy wróci na stan.
          </p>
        </div>
      ) : (
        /* Przyciski */
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={() => handleAdd(false)}
            disabled={(hasColorVariants && !color) || maxQty === 0}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4" />
            {added ? "Dodano!" : "Do koszyka"}
          </Button>
          <Button
            size="lg"
            onClick={() => handleAdd(true)}
            disabled={(hasColorVariants && !color) || maxQty === 0}
            variant="outline"
            className="flex-1"
          >
            Kup teraz
          </Button>
        </div>
      )}
    </div>
  );
}
