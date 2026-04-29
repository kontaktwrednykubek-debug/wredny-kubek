"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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

type OrderRow = {
  id: string;
  product_id: string;
  amount_grosze: number;
  quantity: number;
  status: string;
  created_at: string;
};

export function OrdersClient({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Usunąć to zamówienie z historii? Tej operacji nie można cofnąć.",
      )
    )
      return;
    setPending(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
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

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const product = (() => {
          try {
            return getProduct(o.product_id as never);
          } catch {
            return null;
          }
        })();
        return (
          <article
            key={o.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {product?.name ?? o.product_id} ×{o.quantity ?? 1}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleString("pl-PL")} · #
                {o.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-primary">
                  {formatPrice(o.amount_grosze)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {statusLabels[o.status] ?? o.status}
                </p>
              </div>
              <button
                onClick={() => handleDelete(o.id)}
                disabled={pending === o.id}
                aria-label="Usuń zamówienie"
                className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
