"use client";

import { useEffect } from "react";
import { usePromoStore } from "@/features/promo/usePromoStore";
import { useCart } from "@/features/cart/useCart";

/**
 * Fetchuje aktywną promocję raz przy starcie aplikacji (globalnie w layoucie).
 * Dzięki temu getCurrentPromo() w useCart zwraca prawidłowe dane
 * nawet gdy user dodaje produkt ze strony sklepu (nie tylko z koszyka).
 */
export function PromoProvider({ children }: { children: React.ReactNode }) {
  const fetchPromo = usePromoStore((s) => s.fetch);
  const promo = usePromoStore((s) => s.promo);
  const resync = useCart((s) => s.resync);

  // Załaduj promo przy starcie
  useEffect(() => {
    fetchPromo();
  }, [fetchPromo]);

  // Gdy promo się załaduje lub zmieni → przelicz koszyk
  useEffect(() => {
    resync();
  }, [promo, resync]);

  return <>{children}</>;
}
