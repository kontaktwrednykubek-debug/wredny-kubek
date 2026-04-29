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
      "id, product_id, amount_grosze, quantity, status, created_at, preview_url",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = await backfillOrderPreviews(supabase, rawOrders ?? []);

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
      <OrdersClient orders={orders} />
    </section>
  );
}
