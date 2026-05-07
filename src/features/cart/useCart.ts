"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductId } from "@/config/products";
import { useEffect } from "react";

export type CartItem = {
  id: string;
  designId: string | null;
  /** Personalizowany: ProductId z konfigu. Sklepowy: "shop:<slug>" lub slug bez prefixu. */
  productId: ProductId | string;
  quantity: number;
  unitPriceGr: number;
  previewUrl?: string;
  label: string;
  variant?: { color?: string; size?: string };
  maxQty?: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const id =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2);
          return {
            items: [
              ...state.items,
              { id, quantity: item.quantity ?? 1, ...item },
            ],
          };
        }),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i;
            const max = i.maxQty ?? 999;
            return { ...i, quantity: Math.min(max, Math.max(1, quantity)) };
          }),
        })),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { 
      name: "kubkomania-cart",
      onRehydrateStorage: () => (state) => {
        // Auto-clear shop items without variant on rehydration
        if (state) {
          const itemsWithVariant = state.items.filter(
            item => !item.productId.startsWith("shop:") || item.variant?.color
          );
          if (itemsWithVariant.length !== state.items.length) {
            console.log("[useCart] Auto-cleared shop items without variant:", state.items.length - itemsWithVariant.length);
            state.items = itemsWithVariant;
          }
        }
      },
    },
  ),
);

// Hook to auto-clear on mount
export function useAutoClearCart() {
  const clear = useCart(state => state.clear);
  const items = useCart(state => state.items);
  
  useEffect(() => {
    const itemsWithoutVariant = items.filter(
      item => item.productId.startsWith("shop:") && !item.variant?.color
    );
    if (itemsWithoutVariant.length > 0) {
      console.log("[useAutoClearCart] Clearing", itemsWithoutVariant.length, "shop items without variant");
      // Remove only shop items without variant, keep others
      const itemsToKeep = items.filter(
        item => !item.productId.startsWith("shop:") || item.variant?.color
      );
      clear();
      // Re-add valid items
      itemsToKeep.forEach(item => {
        useCart.getState().add(item);
      });
    }
  }, [items, clear]);
}

export function cartTotalGr(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceGr * i.quantity, 0);
}
