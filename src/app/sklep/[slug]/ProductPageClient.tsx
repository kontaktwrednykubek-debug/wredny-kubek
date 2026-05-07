"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [variantStockMap, setVariantStockMap] = React.useState(initialStockMap);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Refresh stock after payment completion
  React.useEffect(() => {
    const paymentSuccess = searchParams.get("payment") === "success";
    const paymentCanceled = searchParams.get("payment") === "canceled";
    
    if (paymentSuccess || paymentCanceled) {
      // Clean URL params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
      
      // Refresh stock after payment
      refreshStock();
    }
  }, [searchParams, slug]);
  
  // Listen for stock updates from other tabs (after purchase)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `stock-update-${slug}` && e.newValue) {
        refreshStock();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [slug]);
  
  async function refreshStock() {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/shop-products/${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.variant_stock) {
          setVariantStockMap(data.variant_stock);
        }
      }
    } catch (err) {
      console.error("Failed to refresh stock:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

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
