"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/useCart";

type Variant = {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  stockCount: number;
};

export function BuyNowSection({
  slug,
  title,
  priceGrosze,
  cover,
  showVariantStock,
}: {
  slug: string;
  title: string;
  priceGrosze: number;
  cover: string | null;
  showVariantStock: boolean;
}) {
  const router = useRouter();
  const add = useCart((state) => state.add);
  const [variants, setVariants] = React.useState<Variant[]>([]);
  const [color, setColor] = React.useState<string | null>(null);
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
  
  const maxQty = showVariantStock && color ? 
    (variants.find(v => v.id === color)?.stockCount ?? 999) : 999;

  const buildLabel = () => {
    const variant = variants.find(v => v.id === color);
    if (!variant) return title;
    return `${title} - ${variant.name}`;
  };

  const handleAdd = (redirect = false) => {
    if (!color || maxQty < 1) return;
    const variant = variants.find(v => v.id === color);
    if (!variant) return;
    
    add({
      designId: null,
      productId: `shop:${slug}`,
      unitPriceGr: priceGrosze,
      previewUrl: cover ?? undefined,
      label: buildLabel(),
      quantity: qty,
      maxQty: maxQty < 999 ? maxQty : undefined,
      variant: {
        color: variant.id,
      },
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
              const isDisabled = showVariantStock && stock === 0;
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

      {/* Przyciski */}
      <div className="flex gap-3">
        <Button
          size="lg"
          onClick={() => handleAdd(false)}
          disabled={!color || maxQty === 0}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4" />
          {added ? "Dodano!" : "Do koszyka"}
        </Button>
        <Button
          size="lg"
          onClick={() => handleAdd(true)}
          disabled={!color || maxQty === 0}
          variant="outline"
          className="flex-1"
        >
          Kup teraz
        </Button>
      </div>
    </div>
  );
}
