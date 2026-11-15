import type { DiscountType } from "./types";

function pln(grosze: number): string {
  return `${(grosze / 100).toFixed(2).replace(".", ",")} zł`;
}

/** Nazwa typu rabatu do selecta w panelu admina. */
export const DISCOUNT_TYPE_NAMES: Record<DiscountType, string> = {
  percent: "Procentowy (%)",
  fixed: "Kwotowy (zł)",
  free_shipping: "Darmowa dostawa",
  gift: "Gratis",
  second_percent: "Drugi kubek — procentowy (%)",
  second_fixed: "Drugi kubek — kwotowy (zł)",
};

/** Krótki opis wartości rabatu, np. „-10%", „-15,00 zł na 1 szt. (min. 2 szt.)". */
export function discountValueLabel(
  type: DiscountType,
  value: number | null,
  giftDescription?: string | null,
): string {
  switch (type) {
    case "percent":
      return `-${value ?? 0}%`;
    case "fixed":
      return `-${pln(value ?? 0)}`;
    case "free_shipping":
      return "Darmowa dostawa";
    case "gift":
      return giftDescription ? `Gratis: ${giftDescription}` : "Gratis";
    case "second_percent":
      return `-${value ?? 0}% na 1 szt. (min. 2 szt.)`;
    case "second_fixed":
      return `-${pln(value ?? 0)} na 1 szt. (min. 2 szt.)`;
    default:
      return String(type);
  }
}
