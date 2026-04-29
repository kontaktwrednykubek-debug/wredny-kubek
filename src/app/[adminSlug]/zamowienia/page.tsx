import type * as React from "react";
import { CheckCircle2, Clock, Package, TrendingUp } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { OrderStatusSelect } from "./OrderStatusSelect";

export const metadata = { title: "Zamówienia" };

/** Statusy uznawane za „zarobione" — przeszły opłacenie. */
const PAID_STATUSES = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];

export default async function AdminOrdersPage() {
  const supabase = createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, user_id, product_id, amount_grosze, quantity, status, shipping_info, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const list = orders ?? [];
  const paid = list.filter((o) => PAID_STATUSES.includes(o.status));
  const pending = list.filter((o) => o.status === "PENDING");
  const paidRevenue = paid.reduce((s, o) => s + (o.amount_grosze ?? 0), 0);
  const avgPaid = paid.length ? Math.round(paidRevenue / paid.length) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Zamówienia</h1>

      {/* Statystyki */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Wszystkie zamówienia"
          value={list.length.toString()}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label="Oczekujące"
          value={pending.length.toString()}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label={`Opłacone (${paid.length})`}
          value={formatPrice(paidRevenue)}
          highlight
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          label="Średnia wartość"
          value={formatPrice(avgPaid)}
        />
      </div>
      {!orders?.length ? (
        <p className="text-muted-foreground">Brak zamówień.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Data</th>
                <th className="p-3">Produkt</th>
                <th className="p-3">Klient</th>
                <th className="p-3 text-right">Kwota</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const ship = (o.shipping_info ?? {}) as Record<string, string>;
                return (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">
                      {o.id.slice(0, 8)}
                    </td>
                    <td className="p-3">
                      {new Date(o.created_at).toLocaleString("pl-PL")}
                    </td>
                    <td className="p-3">
                      {o.product_id} ×{o.quantity ?? 1}
                    </td>
                    <td className="p-3">
                      {ship.fullName ?? "—"}
                      {ship.city && (
                        <span className="block text-xs text-muted-foreground">
                          {ship.city}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatPrice(o.amount_grosze)}
                    </td>
                    <td className="p-3">
                      <OrderStatusSelect id={o.id} status={o.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
