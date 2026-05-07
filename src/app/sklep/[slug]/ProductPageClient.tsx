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
    
    console.log("[ProductPageClient] Payment params:", { paymentSuccess, paymentCanceled, slug });
    
    if (paymentSuccess || paymentCanceled) {
      console.log("[ProductPageClient] Detected payment completion, refreshing stock...");
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
    console.log(`[ProductPageClient] Refreshing stock for ${slug}...`);
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/shop-products/${slug}`);
      console.log(`[ProductPageClient] API response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[ProductPageClient] API response data:`, data);
        if (data.variant_stock) {
          console.log(`[ProductPageClient] Updating stock from:`, variantStockMap, "to:", data.variant_stock);
          setVariantStockMap(data.variant_stock);
        }
      } else {
        console.error(`[ProductPageClient] API error: ${res.status}`);
      }
    } catch (err) {
      console.error("[ProductPageClient] Failed to refresh stock:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  console.log(`[ProductPageClient] Rendering with stock:`, variantStockMap);
  
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
