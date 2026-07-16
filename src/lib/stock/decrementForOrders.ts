import type { SupabaseClient } from "@supabase/supabase-js";

type OrderRow = {
  product_id: string | null;
  variant_color: string | null;
  quantity: number | null;
};

/**
 * Zdejmuje stan magazynowy dla OPŁACONYCH zamówień.
 *
 * Wywoływane PO potwierdzeniu płatności przez Stripe (webhook lub /verify) —
 * i tylko przez zwycięzcę atomowego przejścia PENDING→PAID, więc uruchamia się
 * dokładnie raz na koszyk. Dzięki temu porzucona/nieopłacona płatność NIE
 * blokuje sztuki w sklepie — stan schodzi wyłącznie po realnym zakupie.
 *
 * Best-effort: przy niepowodzeniu CAS (np. ktoś inny zdążył kupić ostatnią
 * sztukę w oknie między zamówieniem a płatnością) tylko logujemy — płatność
 * i tak przeszła, a admin dostaje powiadomienie o zamówieniu.
 *
 * Obsługuje oba modele stanu:
 *  - kolory: wspólna pula `cup_color_variants.stock_count` per wariant,
 *  - produkty bez wariantu: stan bazowy w `shop_products.specs["Ilość"]`.
 */
export async function decrementStockForPaidOrders(
  service: SupabaseClient,
  orderRows: OrderRow[],
): Promise<void> {
  // Agregacja: kolory per variant_color, produkty bez wariantu per slug.
  const qtyByVariant = new Map<string, number>();
  const qtyBySlug = new Map<string, number>();
  for (const o of orderRows) {
    const qty = o.quantity ?? 0;
    if (qty <= 0) continue;
    if (o.variant_color) {
      qtyByVariant.set(
        o.variant_color,
        (qtyByVariant.get(o.variant_color) ?? 0) + qty,
      );
    } else if (o.product_id?.startsWith("shop:")) {
      const slug = o.product_id.slice("shop:".length);
      qtyBySlug.set(slug, (qtyBySlug.get(slug) ?? 0) + qty);
    }
  }

  // --- Kolory: CAS na cup_color_variants.stock_count ---
  for (const [variantId, qty] of qtyByVariant) {
    let done = false;
    for (let attempt = 0; attempt < 5 && !done; attempt++) {
      const { data: row, error } = await service
        .from("cup_color_variants")
        .select("stock_count")
        .eq("id", variantId)
        .maybeSingle();
      if (error || !row) {
        console.error("[stock] wariant nie znaleziony przy zdejmowaniu:", variantId, error);
        break;
      }
      const available = row.stock_count ?? 0;
      if (available < qty) {
        console.error(
          `[stock] oversold: wariant ${variantId} ma ${available}, opłacono ${qty}. Wymaga ręcznej korekty.`,
        );
        break;
      }
      const { data: updated } = await service
        .from("cup_color_variants")
        .update({ stock_count: available - qty })
        .eq("id", variantId)
        .eq("stock_count", available)
        .select("id");
      if (updated && updated.length > 0) done = true;
    }
  }

  // --- Produkty bez wariantu: CAS na specs["Ilość"] ---
  for (const [slug, qty] of qtyBySlug) {
    let done = false;
    for (let attempt = 0; attempt < 5 && !done; attempt++) {
      const { data: row, error } = await service
        .from("shop_products")
        .select("specs")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !row) {
        console.error("[stock] produkt nie znaleziony przy zdejmowaniu:", slug, error);
        break;
      }
      const specs = (row.specs as Record<string, string> | null) ?? {};
      const parsed = parseInt(specs["Ilość"] ?? "", 10);
      // Brak limitu (pole puste / nie-liczba) — nic nie zdejmujemy.
      if (!Number.isFinite(parsed)) {
        done = true;
        break;
      }
      if (parsed < qty) {
        console.error(
          `[stock] oversold: produkt ${slug} ma ${parsed}, opłacono ${qty}. Wymaga ręcznej korekty.`,
        );
        break;
      }
      const { data: updated } = await service
        .from("shop_products")
        .update({ specs: { ...specs, "Ilość": String(parsed - qty) } })
        .eq("slug", slug)
        .eq("specs->>Ilość", String(parsed))
        .select("id");
      if (updated && updated.length > 0) done = true;
    }
  }
}
