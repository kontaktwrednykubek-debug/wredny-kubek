"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductId } from "@/config/products";

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
    (set) => ({
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
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i,
          ),
        })),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "kubkomania-cart" },
  ),
);

export function cartTotalGr(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceGr * i.quantity, 0);
}
