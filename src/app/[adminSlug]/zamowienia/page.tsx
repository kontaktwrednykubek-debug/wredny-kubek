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

export const metadata = { title: "Zamówienia" };

const PAID_STATUSES = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];

export default async function AdminOrdersPage() {
  const supabase = createSupabaseServerClient();
  const { data: rawOrders } = await supabase
    .from("orders")
    .select(
      "id, user_id, product_id, amount_grosze, quantity, status, shipping_info, created_at, preview_url, shipping_carrier, shipping_label_url, shipping_tracking_number, shipping_label_status",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const orders = await backfillOrderPreviews(supabase, rawOrders ?? []);
  const list = orders;
  const paid = list.filter((o) => PAID_STATUSES.includes(o.status));
  const pending = list.filter((o) => o.status === "PENDING");
  const paidRevenue = paid.reduce((s, o) => s + (o.amount_grosze ?? 0), 0);
  const avgPaid = paid.length ? Math.round(paidRevenue / paid.length) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Zamówienia</h1>

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

      {list.length === 0 ? (
        <p className="text-muted-foreground">Brak zamówień.</p>
      ) : (
        <div className="space-y-3">
          {list.map((o) => {
            const ship = (o.shipping_info ?? {}) as Record<
              string,
              string | undefined
            >;
            return (
              <article
                key={o.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <OrderThumbnail
                    src={o.preview_url}
                    alt={o.product_id ?? ""}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="font-semibold">
                        {o.product_id} ×{o.quantity ?? 1}
                      </p>
                      <code className="font-mono text-xs text-muted-foreground">
                        #{o.id.slice(0, 8)}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pl-PL")}
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
                      {formatPrice(o.amount_grosze)}
                    </p>
                    <div className="mt-1">
                      <OrderStatusSelect id={o.id} status={o.status} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-border/50 pt-3">
                  <OrderShippingActions
                    orderId={o.id}
                    status={o.status}
                    carrier={o.shipping_carrier ?? null}
                    labelUrl={o.shipping_label_url ?? null}
                    trackingNumber={o.shipping_tracking_number ?? null}
                    labelStatus={o.shipping_label_status ?? null}
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
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
