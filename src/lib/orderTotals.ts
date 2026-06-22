/**
 * Wspólne liczenie kwoty zamówienia (grupy pozycji o wspólnym group_id).
 *
 * W bazie `amount_grosze` to cena katalogowa pozycji (cena × ilość) — BEZ rabatu.
 * Rabat jest zapisany jako `discount_grosze` na pierwszym wierszu zamówienia,
 * a cena dostawy w `shipping_info.shippingPriceGr`. Realna kwota zapłacona przez
 * klienta (zgodna z sesją Stripe) to:
 *
 *   suma(amount_grosze) − suma(discount_grosze) + dostawa
 *
 * gdzie dostawa = 0 dla kodu typu `free_shipping`.
 */
export type OrderTotalRow = {
  amount_grosze?: number | null;
  discount_grosze?: number | null;
  shipping_info?: unknown;
};

export type OrderTotals = {
  /** Suma cen katalogowych pozycji (przed rabatem, bez dostawy). */
  itemsTotal: number;
  /** Łączny rabat w groszach. */
  discountGr: number;
  /** Cena dostawy w groszach (już z uwzględnieniem darmowej dostawy). */
  shippingGr: number;
  /** Realna kwota do zapłaty / zapłacona. */
  total: number;
};

export function computeOrderTotals(
  rows: OrderTotalRow[],
  opts: { freeShipping?: boolean } = {},
): OrderTotals {
  const itemsTotal = rows.reduce((s, r) => s + (r.amount_grosze ?? 0), 0);
  const discountGr = rows.reduce((s, r) => s + (r.discount_grosze ?? 0), 0);
  const ship = (rows[0]?.shipping_info ?? {}) as { shippingPriceGr?: number };
  const rawShipping = Number(ship.shippingPriceGr ?? 0);
  const shippingGr = opts.freeShipping ? 0 : rawShipping;
  const total = Math.max(0, itemsTotal - discountGr) + shippingGr;
  return { itemsTotal, discountGr, shippingGr, total };
}
