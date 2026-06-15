import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/BackLink";
import { backfillOrderPreviews } from "@/lib/orderPreviews";
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
      "id, group_id, product_id, label, amount_grosze, quantity, status, created_at, preview_url",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = await backfillOrderPreviews(supabase, rawOrders ?? []);

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
    return {
      id: first.id, // reprezentant — link do szczegółów
      status: first.status,
      created_at: first.created_at,
      totalGrosze: rows.reduce((s, r) => s + (r.amount_grosze ?? 0), 0),
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
