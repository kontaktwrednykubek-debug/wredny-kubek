"use client";

import * as React from "react";
import { BuyNowSection } from "./BuyNowSection";

type Variants = {
  colors?: { name: string; hex: string }[];
  cupColors?: { id: string; name: string; imageUrl: string }[];
  capacities?: string[];
  sizes?: string[];
};

export function ProductPageClient({
  slug,
  title,
  priceGrosze,
  cover,
  variants,
  showVariantStock,
  variantStockMap: initialStockMap,
}: {
  slug: string;
  title: string;
  priceGrosze: number;
  cover: string | null;
  variants: Variants;
  showVariantStock: boolean;
  variantStockMap: Record<string, number>;
}) {
  const [variantStockMap, setVariantStockMap] = React.useState(initialStockMap);

  // Listen for stock updates from other tabs (after purchase)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `stock-update-${slug}` && e.newValue) {
        // Refresh stock from server
        fetch(`/api/shop-products/${slug}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.variant_stock) {
              setVariantStockMap(data.variant_stock);
            }
          })
          .catch((err) => console.error("Failed to refresh stock:", err));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [slug]);

  return (
    <BuyNowSection
      slug={slug}
      title={title}
      priceGrosze={priceGrosze}
      cover={cover}
      variants={variants}
      showVariantStock={showVariantStock}
      variantStockMap={variantStockMap}
    />
  );
}
