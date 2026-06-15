"use client";

import { create } from "zustand";

export type Promotion = {
  id: string;
  active: boolean;
  buy_qty: number;
  get_qty: number;
  label: string;
};

type PromoState = {
  promo: Promotion | null;
  loaded: boolean;
  fetch: () => Promise<void>;
  setPromo: (p: Promotion | null) => void;
};

export const usePromoStore = create<PromoState>((set) => ({
  promo: null,
  loaded: false,
  fetch: async () => {
    try {
      const res = await fetch("/api/promotions", { cache: "no-store" });
      if (!res.ok) return;
      const { promotion } = await res.json();
      set({ promo: promotion ?? null, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  setPromo: (p) => set({ promo: p }),
}));
