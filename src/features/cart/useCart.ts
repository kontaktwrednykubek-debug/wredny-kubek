"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductId } from "@/config/products";
import { usePromoStore, type Promotion } from "@/features/promo/usePromoStore";
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
  // maxQty is NOT persisted - always fetched from database
  maxQty?: number;
  /** Pozycja dodana automatycznie przez promocję "kup X dostaniesz Y gratis" */
  isGratis?: boolean;
  /** ID promocji która wygenerowała tę pozycję */
  promoId?: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Wywoływany gdy promo zmienia się z zewnątrz (np. admin włączył/wyłączył) */
  resync: () => void;
};

/** Stały productId dla upsellu "Kubek w ciemno" (losowy wzór). */
export const MYSTERY_MUG_ID = "mystery-mug";

function makeId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/**
 * Przelicza pozycje gratis na podstawie aktualnego stanu koszyka i aktywnej promocji.
 * Dla każdej grupy (productId + designId + color + size) jeśli łączna ilość
 * płatnych sztuk >= buy_qty, wstawia pozycję gratis.
 * Usuwa gratis gdy ilość spada poniżej progu lub promocja jest nieaktywna.
 */
function syncGratis(items: CartItem[], promo: Promotion | null): CartItem[] {
  // Usuń wszystkie stare gratis niezależnie od stanu promo
  const paid = items.filter((i) => !i.isGratis);

  if (!promo || !promo.active) return paid;

  // Kubek w ciemno (upsell) NIE liczy się do promocji "kup X gratis"
  const eligible = paid.filter((i) => i.productId !== MYSTERY_MUG_ID);

  // Liczymy ŁĄCZNĄ ilość wszystkich płatnych sztuk (nie per-produkt)
  const totalQty = eligible.reduce((s, i) => s + i.quantity, 0);
  const gratisCount = Math.floor(totalQty / promo.buy_qty) * promo.get_qty;

  if (gratisCount <= 0) return paid;

  // Gratis = najtańszy produkt z koszyka (lub pierwszy jeśli ceny równe)
  const cheapest = eligible.reduce((min, i) =>
    i.unitPriceGr < min.unitPriceGr ? i : min,
  );

  const gratisItem: CartItem = {
    id: makeId(),
    designId: cheapest.designId,
    productId: cheapest.productId,
    quantity: gratisCount,
    unitPriceGr: 0,
    previewUrl: cheapest.previewUrl,
    label: cheapest.label,
    variant: cheapest.variant,
    isGratis: true,
    promoId: promo.id,
  };

  return [...paid, gratisItem];
}

/** Pobiera aktywną promocję ze store (działa poza hookami React) */
function getCurrentPromo(): Promotion | null {
  return usePromoStore.getState().promo;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const incomingQty = item.quantity ?? 1;

          const existingIdx = state.items.findIndex(
            (i) =>
              !i.isGratis &&
              i.productId === item.productId &&
              (i.designId ?? null) === (item.designId ?? null) &&
              (i.variant?.color ?? null) === (item.variant?.color ?? null) &&
              (i.variant?.size ?? null) === (item.variant?.size ?? null),
          );

          let next: CartItem[];

          if (existingIdx >= 0) {
            const existing = state.items[existingIdx];
            const max = existing.maxQty ?? 999;
            const merged = {
              ...existing,
              quantity: Math.min(max, existing.quantity + incomingQty),
            };
            next = [...state.items];
            next[existingIdx] = merged;
          } else {
            next = [...state.items, { id: makeId(), ...item, quantity: incomingQty }];
          }

          return { items: syncGratis(next, getCurrentPromo()) };
        }),
      setQuantity: (id, quantity) =>
        set((state) => {
          const next = state.items.map((i) => {
            if (i.id !== id) return i;
            const max = i.maxQty ?? 999;
            return { ...i, quantity: Math.min(max, Math.max(1, quantity)) };
          });
          return { items: syncGratis(next, getCurrentPromo()) };
        }),
      remove: (id) =>
        set((state) => {
          const next = state.items.filter((i) => i.id !== id);
          return { items: syncGratis(next, getCurrentPromo()) };
        }),
      clear: () => set({ items: [] }),
      resync: () =>
        set((state) => ({
          items: syncGratis(state.items, getCurrentPromo()),
        })),
    }),
    {
      name: "kubkomania-cart",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const itemsWithVariant = state.items.filter(
            (item) => !item.productId.startsWith("shop:") || item.variant?.color,
          );
          if (itemsWithVariant.length !== state.items.length) {
            state.items = itemsWithVariant;
          }
          state.items = state.items.map((item) => ({ ...item, maxQty: undefined }));
        }
      },
    },
  ),
);

// Hook to auto-clear on mount
export function useAutoClearCart() {
  const clear = useCart((state) => state.clear);
  const items = useCart((state) => state.items);

  useEffect(() => {
    const itemsWithoutVariant = items.filter(
      (item) => item.productId.startsWith("shop:") && !item.variant?.color,
    );
    if (itemsWithoutVariant.length > 0) {
      const itemsToKeep = items.filter(
        (item) => !item.productId.startsWith("shop:") || item.variant?.color,
      );
      clear();
      itemsToKeep.forEach((item) => {
        useCart.getState().add(item);
      });
    }
  }, [items, clear]);
}

export function cartTotalGr(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceGr * i.quantity, 0);
}

/** Wartość rabatu wynikającego z pozycji gratis (ile klient oszczędza). */
export function cartGratisDiscountGr(items: CartItem[]): number {
  return items
    .filter((i) => i.isGratis)
    .reduce((sum, gratis) => {
      const paid = items.find(
        (p) =>
          !p.isGratis &&
          p.productId === gratis.productId &&
          (p.designId ?? null) === (gratis.designId ?? null) &&
          (p.variant?.color ?? null) === (gratis.variant?.color ?? null),
      );
      const unitPrice = paid?.unitPriceGr ?? 0;
      return sum + unitPrice * gratis.quantity;
    }, 0);
}
