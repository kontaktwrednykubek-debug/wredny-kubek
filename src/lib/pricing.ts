import { getProduct, type ProductId } from "@/config/products";

export type DesignDataSummary = {
  textElements?: number;
  imageElements?: number;
  fullColor?: boolean;
};

/**
 * Wylicza cenę produktu w groszach na podstawie konfiguracji + opcji projektu.
 * Trzymamy logikę PO STRONIE SERWERA — cena z klienta jest zawsze ignorowana.
 */
export function calculatePrice(
  productId: ProductId,
  design: DesignDataSummary = {},
): number {
  const product = getProduct(productId);
  let price = product.basePrice;

  if (design.imageElements && design.imageElements > 0) {
    price += 500; // dopłata za nadruk full-color
  }
  if (design.textElements && design.textElements > 3) {
    price += 200 * (design.textElements - 3);
  }

  return price;
}
