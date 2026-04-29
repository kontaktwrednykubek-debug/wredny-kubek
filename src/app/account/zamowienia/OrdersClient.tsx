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

type OrderRow = {
  id: string;
  product_id: string;
  amount_grosze: number;
  quantity: number;
  status: string;
  created_at: string;
  preview_url: string | null;
};

export function OrdersClient({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
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
          <Link
            key={o.id}
            href={`/account/zamowienia/${o.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-sm"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
              {o.preview_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={o.preview_url}
                  alt={product?.name ?? o.product_id}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {product?.name ?? o.product_id}{" "}
                <span className="text-muted-foreground">×{o.quantity ?? 1}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleString("pl-PL")} · #
                {o.id.slice(0, 8)}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  statusBadge[o.status] ?? "bg-muted text-foreground"
                }`}
              >
                {statusLabels[o.status] ?? o.status}
              </span>
            </div>

            <div className="text-right">
              <p className="font-bold text-primary">
                {formatPrice(o.amount_grosze)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleDelete(e, o.id)}
                disabled={pending === o.id}
                aria-label="Usuń zamówienie"
                className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
