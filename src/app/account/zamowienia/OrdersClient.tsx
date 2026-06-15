"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ImageOff, Trash2 } from "lucide-react";
import { getProduct } from "@/config/products";
import { formatPrice } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PENDING: "Oczekujące",
  PAID: "Opłacone",
  IN_PRODUCTION: "W produkcji",
  SHIPPED: "Wysłane",
  DELIVERED: "Dostarczone",
  CANCELLED: "Anulowane",
};

const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-blue-800",
  IN_PRODUCTION: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

type OrderItem = {
  id: string;
  product_id: string;
  label: string | null;
  quantity: number;
  amount_grosze: number;
  preview_url: string | null;
};

type GroupedOrder = {
  id: string;
  status: string;
  created_at: string;
  totalGrosze: number;
  ids: string[];
  items: OrderItem[];
};

export function OrdersClient({ orders }: { orders: GroupedOrder[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, ids: string[], groupId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        "Usunąć to zamówienie z historii? Tej operacji nie można cofnąć.",
      )
    )
      return;
    setPending(groupId);
    try {
      // Usuń wszystkie pozycje z tego zamówienia (wspólny koszyk)
      await Promise.all(ids.map((id) => fetch(`/api/orders/${id}`, { method: "DELETE" })));
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Nie masz jeszcze zamówień.</p>
      </div>
    );
  }

  const labelFor = (item: OrderItem) => {
    try {
      return item.label ?? getProduct(item.product_id as never)?.name ?? item.product_id;
    } catch {
      return item.label ?? item.product_id;
    }
  };

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const itemCount = o.items.reduce((s, i) => s + (i.quantity ?? 1), 0);
        return (
          <Link
            key={o.id}
            href={`/account/zamowienia/${o.id}`}
            className="group block rounded-2xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-sm"
          >
            {/* Nagłówek zamówienia */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("pl-PL")} · #{o.id.slice(0, 8)}
                </p>
                <span
                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    statusBadge[o.status] ?? "bg-muted text-foreground"
                  }`}
                >
                  {statusLabels[o.status] ?? o.status}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleDelete(e, o.ids, o.id)}
                  disabled={pending === o.id}
                  aria-label="Usuń zamówienie"
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </div>

            {/* Pozycje — jedna pod drugą */}
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {o.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    {item.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.preview_url}
                        alt={labelFor(item)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {labelFor(item)}{" "}
                      <span className="text-muted-foreground">×{item.quantity ?? 1}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatPrice(item.amount_grosze)}
                  </p>
                </div>
              ))}
            </div>

            {/* Suma całego zamówienia */}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">
                Razem ({itemCount} {itemCount === 1 ? "szt." : "szt."})
              </span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(o.totalGrosze)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
