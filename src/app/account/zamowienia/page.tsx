import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/BackLink";
import { backfillOrderPreviews } from "@/lib/orderPreviews";
import { computeOrderTotals } from "@/lib/orderTotals";
import { OrdersClient } from "./OrdersClient";

export const metadata = { title: "Twoje zamówienia" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/zamowienia");

  const { data: rawOrders } = await supabase
    .from("orders")
    .select(
      "id, group_id, product_id, label, amount_grosze, quantity, status, created_at, preview_url, shipping_info, discount_grosze, discount_code_id",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = await backfillOrderPreviews(supabase, rawOrders ?? []);

  // Typy użytych kodów rabatowych (rozpoznanie darmowej dostawy).
  const codeIds = Array.from(
    new Set(
      (orders as { discount_code_id?: string | null }[])
        .map((o) => o.discount_code_id)
        .filter((x): x is string => Boolean(x)),
    ),
  );
  const freeShipCodeIds = new Set<string>();
  if (codeIds.length > 0) {
    const { data: codes } = await supabase
      .from("discount_codes")
      .select("id, type")
      .in("id", codeIds);
    for (const c of codes ?? []) {
      if ((c as { type?: string }).type === "free_shipping")
        freeShipCodeIds.add((c as { id: string }).id);
    }
  }

  // Grupuj pozycje z jednego koszyka (wspólny group_id) w JEDNO zamówienie —
  // tak jak w panelu admina. Bez group_id traktujemy wiersz jako osobny.
  type Row = (typeof orders)[number] & { group_id?: string | null };
  const groupMap = new Map<string, Row[]>();
  for (const o of orders as Row[]) {
    const key = o.group_id ?? o.id;
    const arr = groupMap.get(key);
    if (arr) arr.push(o);
    else groupMap.set(key, [o]);
  }

  const groupedOrders = Array.from(groupMap.values()).map((rows) => {
    const first = rows[0];
    const freeShipping = freeShipCodeIds.has(
      (first as { discount_code_id?: string | null }).discount_code_id ?? "",
    );
    const totals = computeOrderTotals(rows, { freeShipping });
    return {
      id: first.id, // reprezentant — link do szczegółów
      status: first.status,
      created_at: first.created_at,
      totalGrosze: totals.total,
      discountGrosze: totals.discountGr,
      subtotalGrosze: totals.itemsTotal + totals.shippingGr,
      ids: rows.map((r) => r.id),
      items: rows.map((r) => ({
        id: r.id,
        product_id: r.product_id,
        label: r.label,
        quantity: r.quantity,
        amount_grosze: r.amount_grosze,
        preview_url: r.preview_url,
      })),
    };
  });

  return (
    <section className="container mx-auto max-w-4xl px-4 py-8">
      <BackLink href="/account" label="Wróć do panelu" />
      <h1 className="mb-2 text-3xl font-bold">Twoje zamówienia</h1>
      {searchParams.ok && (
        <p className="mb-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          Dziękujemy! Zamówienie zostało przyjęte. Skontaktujemy się w sprawie
          płatności i wysyłki.
        </p>
      )}
      <OrdersClient orders={groupedOrders} />
    </section>
  );
}
