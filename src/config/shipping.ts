/**
 * Metody wysyłki Furgonetka.pl dostępne dla klienta.
 * `requiresParcelCode` = true → klient musi podać kod paczkomatu / punktu odbioru.
 */
export type ShippingMethodId =
  | "inpost_paczkomat"
  | "inpost_kurier"
  | "dpd_kurier"
  | "dhl_kurier"
  | "poczta_polska"
  | "odbior_osobisty";

export type ShippingMethod = {
  id: ShippingMethodId;
  name: string;
  description: string;
  priceGrosze: number;
  requiresParcelCode?: boolean;
};

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "inpost_paczkomat",
    name: "Paczkomat InPost",
    description: "Odbiór 24/7 z najbliższego paczkomatu",
    priceGrosze: 1499,
    requiresParcelCode: true,
  },
  {
    id: "inpost_kurier",
    name: "Kurier InPost",
    description: "Dostawa pod wskazany adres",
    priceGrosze: 1899,
  },
  {
    id: "dpd_kurier",
    name: "Kurier DPD",
    description: "Standardowa dostawa kurierska",
    priceGrosze: 1999,
  },
  {
    id: "dhl_kurier",
    name: "Kurier DHL",
    description: "Szybka dostawa kurierska",
    priceGrosze: 2199,
  },
  {
    id: "poczta_polska",
    name: "Poczta Polska",
    description: "Przesyłka pocztowa priorytetowa",
    priceGrosze: 1299,
  },
  {
    id: "odbior_osobisty",
    name: "Odbiór osobisty",
    description: "Odbiór po wcześniejszym ustaleniu",
    priceGrosze: 0,
  },
];

export function getShippingMethod(id: string): ShippingMethod | undefined {
  return SHIPPING_METHODS.find((m) => m.id === id);
}
