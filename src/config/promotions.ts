/**
 * Konfiguracja promocji automatycznych.
 * Zmień `active` na false żeby wyłączyć promocję globalnie.
 */

export type PromoRule = {
  id: string;
  active: boolean;
  /** Minimalna ilość produktu aby promocja zadziałała */
  buyQty: number;
  /** Ile sztuk gratis */
  getQty: number;
  /** null = dotyczy wszystkich produktów, string[] = tylko wybrane productId */
  eligibleProductIds: string[] | null;
  label: string;
};

export const PROMOTIONS: PromoRule[] = [
  {
    id: "buy3get1",
    active: true,
    buyQty: 3,
    getQty: 1,
    eligibleProductIds: null, // dotyczy wszystkich
    label: "Kup 3, dostaniesz 4. gratis!",
  },
];

export function getActivePromo(): PromoRule | null {
  return PROMOTIONS.find((p) => p.active) ?? null;
}

export function isEligibleForPromo(
  productId: string,
  promo: PromoRule,
): boolean {
  if (!promo.eligibleProductIds) return true;
  return promo.eligibleProductIds.includes(productId);
}
