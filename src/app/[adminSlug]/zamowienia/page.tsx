import type * as React from "react";
import { CheckCircle2, Clock, Package, TrendingUp } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { backfillOrderPreviews } from "@/lib/orderPreviews";
import { formatPrice } from "@/lib/utils";
import { OrderStatusSelect } from "./OrderStatusSelect";
import {
  OrderShippingActions,
  OrderThumbnail,
} from "./OrderShippingActions";
import { OrdersExport } from "./OrdersExport";
import { DeleteOrderButton } from "./DeleteOrderButton";

export const metadata = { title: "Zamówienia" };

const PAID_STATUSES = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];

export default async function AdminOrdersPage() {
  const supabase = createSupabaseServerClient();
  const { data: rawOrders } = await supabase
    .from("orders")
    .select(
      "id, user_id, group_id, product_id, label, amount_grosze, quantity, status, shipping_info, created_at, preview_url",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const orders = await backfillOrderPreviews(supabase, rawOrders ?? []);
  const list = orders;

  // Grupuj pozycje z jednego koszyka (wspólny group_id) w jedno zamówienie.
  type OrderRow = (typeof list)[number] & { group_id?: string | null };
  const groupMap = new Map<string, OrderRow[]>();
  for (const o of list as OrderRow[]) {
    const key = o.group_id ?? o.id;
    const arr = groupMap.get(key);
    if (arr) arr.push(o);
    else groupMap.set(key, [o]);
  }
  const groups = Array.from(groupMap.values());

  const paid = groups.filter((g) => PAID_STATUSES.includes(g[0].status));
  const pending = groups.filter((g) => g[0].status === "PENDING");
  const paidRevenue = paid.reduce(
    (s, g) => s + g.reduce((x, o) => x + (o.amount_grosze ?? 0), 0),
    0,
  );
  const avgPaid = paid.length ? Math.round(paidRevenue / paid.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Zamówienia</h1>
        <OrdersExport
          orders={list.map((o) => ({
            ...o,
            shipping_info: (o.shipping_info ?? null) as Record<string, string | undefined> | null,
          }))}
          adminSlug=""
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Wszystkie zamówienia"
          value={groups.length.toString()}
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

      {groups.length === 0 ? (
        <p className="text-muted-foreground">Brak zamówień.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const primary = group[0];
            const ids = group.map((o) => o.id);
            const totalGr = group.reduce(
              (s, o) => s + (o.amount_grosze ?? 0),
              0,
            );
            const ship = (primary.shipping_info ?? {}) as Record<
              string,
              string | undefined
            >;
            return (
              <article
                key={primary.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    {group.map((o) => (
                      <div key={o.id} className="flex items-center gap-3">
                        <OrderThumbnail
                          src={o.preview_url}
                          alt={o.product_id ?? ""}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {(o.label as string | null) ?? o.product_id} ×
                            {o.quantity ?? 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(o.amount_grosze)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <code className="font-mono text-xs text-muted-foreground">
                        #{primary.id.slice(0, 8)}
                      </code>
                      {group.length > 1 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {group.length} pozycje
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(primary.created_at).toLocaleString("pl-PL")}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">
                        {ship.fullName ?? "—"}
                      </span>
                      {ship.city && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {ship.city}
                        </span>
                      )}
                      {ship.shippingMethodName && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                          {ship.shippingMethodName as string}
                        </span>
                      )}
                    </p>
                    {ship.parcelCode && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">
                          Paczkomat:
                        </span>{" "}
                        <code className="font-mono">{ship.parcelCode}</code>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(totalGr)}
                    </p>
                    <div className="mt-1">
                      <OrderStatusSelect
                        id={primary.id}
                        ids={ids}
                        status={primary.status}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  <OrderShippingActions
                    orderId={primary.id}
                    shipping={(primary.shipping_info ?? null) as never}
                    status={primary.status}
                  />
                  <DeleteOrderButton
                    orderId={primary.id}
                    orderIds={ids}
                    orderLabel={
                      group.length > 1
                        ? `${(primary.label as string | null) ?? primary.product_id} +${group.length - 1} inne`
                        : ((primary.label as string | null) ??
                          primary.product_id ??
                          "Zamówienie")
                    }
                  />
                </div>
              </article>
            );
          })}
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
      <p className="mt-2 text-xl font-bold sm:text-2xl break-words">{value}</p>
    </div>
  );
}
