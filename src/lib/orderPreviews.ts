import type { SupabaseClient } from "@supabase/supabase-js";
import { productsConfig, type ProductId } from "@/config/products";

/**
 * Doimplementowuje brakujące `preview_url` dla zamówień.
 * - dla `shop:<slug>` — pobiera okładkę z `shop_products.images[0]`,
 * - dla merchu (mug, tshirt, ...) — używa `productsConfig[id].previewImage`.
 * Modyfikuje wejściową tablicę i zwraca ją (mutacja w miejscu dla wygody).
 */
export async function backfillOrderPreviews<
  T extends {
    product_id: string;
    preview_url: string | null;
  },
>(supabase: SupabaseClient, orders: T[]): Promise<T[]> {
  if (orders.length === 0) return orders;

  // 1) Zbierz slug-i sklepowych produktów bez okładki.
  const slugsNeeded = new Set<string>();
  for (const o of orders) {
    if (!o.preview_url && o.product_id?.startsWith("shop:")) {
      slugsNeeded.add(o.product_id.slice("shop:".length));
    }
  }

  // 2) Jednym zapytaniem zaciągnij okładki ze sklepu.
  const slugCovers = new Map<string, string | null>();
  if (slugsNeeded.size > 0) {
    const { data } = await supabase
      .from("shop_products")
      .select("slug, images")
      .in("slug", [...slugsNeeded]);
    for (const p of data ?? []) {
      const cover = (p.images as string[] | null)?.[0] ?? null;
      slugCovers.set(p.slug as string, cover);
    }
  }

  // 3) Wypełnij brakujące preview_url w pamięci.
  for (const o of orders) {
    if (o.preview_url) continue;
    if (o.product_id?.startsWith("shop:")) {
      const slug = o.product_id.slice("shop:".length);
      o.preview_url = slugCovers.get(slug) ?? null;
    } else if ((o.product_id as ProductId) in productsConfig) {
      o.preview_url = productsConfig[o.product_id as ProductId].previewImage;
    }
  }
  return orders;
}
