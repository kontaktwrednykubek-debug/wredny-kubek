import { notFound, redirect } from "next/navigation";
import { ImageOff, Package, Truck, MapPin, Phone, User } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/BackLink";
import { formatPrice } from "@/lib/utils";
import { getProduct } from "@/config/products";
import { backfillOrderPreviews } from "@/lib/orderPreviews";
import { computeOrderTotals } from "@/lib/orderTotals";

export const metadata = { title: "Szczegóły zamówienia" };

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

type Shipping = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  shippingMethod?: string;
  shippingMethodName?: string;
  shippingPriceGr?: number;
  parcelCode?: string;
  note?: string;
};

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/zamowienia/${params.id}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, group_id, product_id, label, amount_grosze, quantity, status, created_at, preview_url, shipping_info, design_id, discount_grosze, discount_code_id",
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  // Pobierz wszystkie pozycje z tego samego koszyka (wspólny group_id)
  const groupId = (order as { group_id?: string | null }).group_id;
  let rows = [order];
  if (groupId) {
    const { data: siblings } = await supabase
      .from("orders")
      .select(
        "id, group_id, product_id, label, amount_grosze, quantity, status, created_at, preview_url, shipping_info, design_id, discount_grosze, discount_code_id",
      )
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (siblings && siblings.length > 0) rows = siblings;
  }

  rows = await backfillOrderPreviews(supabase, rows);

  const shipping = (order.shipping_info as Shipping) ?? {};

  // Czy użyty kod to darmowa dostawa (zeruje dostawę).
  let freeShipping = false;
  const discountCodeId = (order as { discount_code_id?: string | null })
    .discount_code_id;
  if (discountCodeId) {
    const { data: code } = await supabase
      .from("discount_codes")
      .select("type")
      .eq("id", discountCodeId)
      .maybeSingle();
    freeShipping = (code as { type?: string } | null)?.type === "free_shipping";
  }

  const totals = computeOrderTotals(rows, { freeShipping });
  const itemsTotal = totals.itemsTotal;
  const shippingPrice = totals.shippingGr;
  const discountGrosze = totals.discountGr;
  const total = totals.total;

  return (
    <section className="container mx-auto max-w-4xl px-4 py-8">
      <BackLink href="/account/zamowienia" label="Wróć do zamówień" />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Zamówienie</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            #{order.id}
          </p>
          <p className="text-xs text-muted-foreground">
            Złożone: {new Date(order.created_at).toLocaleString("pl-PL")}
          </p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            statusBadge[order.status] ?? "bg-muted text-foreground"
          }`}
        >
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        {/* Produkty — wszystkie pozycje z tego zamówienia */}
        <article className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Package className="h-4 w-4" />
            {rows.length === 1 ? "Produkt" : `Produkty (${rows.length})`}
          </h2>
          <div className="space-y-4">
            {rows.map((r) => {
              const prod = (() => {
                try {
                  return getProduct(r.product_id as never);
                } catch {
                  return null;
                }
              })();
              const unitPrice = r.quantity > 0 ? (r.amount_grosze ?? 0) / r.quantity : 0;
              return (
                <div key={r.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    {r.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.preview_url}
                        alt={prod?.name ?? r.product_id}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <ImageOff className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {(r.label as string | null) ?? prod?.name ?? r.product_id}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ilość: <span className="font-medium">{r.quantity}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cena jednostkowa:{" "}
                      <span className="font-medium">{formatPrice(unitPrice)}</span>
                    </p>
                  </div>
                  <p className="shrink-0 font-bold">{formatPrice(r.amount_grosze ?? 0)}</p>
                </div>
              );
            })}
          </div>
        </article>

        {/* Podsumowanie kwot */}
        <article className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Podsumowanie
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Produkty</dt>
              <dd>{formatPrice(itemsTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dostawa</dt>
              <dd>
                {shippingPrice === 0 ? "Gratis" : formatPrice(shippingPrice)}
              </dd>
            </div>
            {discountGrosze > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Rabat</dt>
                <dd className="font-medium">−{formatPrice(discountGrosze)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>Razem</dt>
              <dd className="text-primary">{formatPrice(total)}</dd>
            </div>
          </dl>
        </article>

        {/* Wysyłka */}
        <article className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Truck className="h-4 w-4" />
            Dostawa
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail
              icon={<Truck className="h-4 w-4" />}
              label="Sposób dostawy"
              value={
                shipping.shippingMethodName ??
                shipping.shippingMethod ??
                "—"
              }
            />
            {shipping.parcelCode && (
              <Detail
                icon={<Package className="h-4 w-4" />}
                label="Kod paczkomatu"
                value={shipping.parcelCode}
              />
            )}
            <Detail
              icon={<User className="h-4 w-4" />}
              label="Odbiorca"
              value={shipping.fullName ?? "—"}
            />
            {shipping.email && (
              <Detail
                icon={<Phone className="h-4 w-4" />}
                label="E-mail"
                value={shipping.email}
              />
            )}
            <Detail
              icon={<Phone className="h-4 w-4" />}
              label="Telefon"
              value={shipping.phone ?? "—"}
            />
            <Detail
              icon={<MapPin className="h-4 w-4" />}
              label="Adres"
              value={
                shipping.address && shipping.city
                  ? `${shipping.address}, ${shipping.zip ?? ""} ${shipping.city}`
                  : "—"
              }
              wide
            />
            {shipping.note && (
              <Detail
                icon={<Package className="h-4 w-4" />}
                label="Uwagi"
                value={shipping.note}
                wide
              />
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function Detail({
  icon,
  label,
  value,
  wide,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-background p-3 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
