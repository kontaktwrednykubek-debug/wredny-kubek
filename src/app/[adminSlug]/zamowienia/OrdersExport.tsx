"use client";

import * as React from "react";
import { Download, Printer, Filter, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

type Order = {
  id: string;
  label: string | null;
  product_id: string | null;
  amount_grosze: number | null;
  quantity: number | null;
  status: string;
  created_at: string;
  shipping_info: Record<string, string | undefined> | null;
};

type Props = {
  orders: Order[];
  adminSlug: string;
};

type DateRange = "all" | "today" | "week" | "month" | "custom";

function getDateLabel(range: DateRange): string {
  switch (range) {
    case "all": return "Wszystkie";
    case "today": return "Dzisiaj";
    case "week": return "Ostatnie 7 dni";
    case "month": return "Ostatnie 30 dni";
    case "custom": return "Własny zakres";
  }
}

function filterOrders(orders: Order[], range: DateRange, from: string, to: string): Order[] {
  const now = new Date();
  let cutFrom: Date | null = null;
  let cutTo: Date | null = null;

  if (range === "today") {
    cutFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "week") {
    cutFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === "month") {
    cutFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === "custom") {
    if (from) cutFrom = new Date(from);
    if (to) {
      cutTo = new Date(to);
      cutTo.setHours(23, 59, 59, 999);
    }
  }

  return orders.filter((o) => {
    const d = new Date(o.created_at);
    if (cutFrom && d < cutFrom) return false;
    if (cutTo && d > cutTo) return false;
    return true;
  });
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekujące",
  PAID: "Opłacone",
  IN_PRODUCTION: "W produkcji",
  SHIPPED: "Wysłane",
  DELIVERED: "Dostarczone",
  CANCELLED: "Anulowane",
};

export function OrdersExport({ orders }: Props) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange>("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const filtered = filterOrders(orders, range, from, to);
  const totalRevenue = filtered
    .filter((o) => ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((s, o) => s + (o.amount_grosze ?? 0), 0);

  function handlePrint() {
    window.print();
  }

  const today = new Date().toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <>
      {/* Trigger button */}
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <FileText className="h-4 w-4" />
        Eksportuj / Drukuj
      </Button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-background shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold">Eksport zamówień</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="border-b border-border px-6 py-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Filtr daty
              </p>
              <div className="flex flex-wrap gap-2">
                {(["all", "today", "week", "month", "custom"] as DateRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      range === r
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    {getDateLabel(r)}
                  </button>
                ))}
              </div>

              {range === "custom" && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Od:</span>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Do:</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                </div>
              )}

              <p className="mt-2 text-xs text-muted-foreground">
                Znaleziono: <strong>{filtered.length}</strong> zamówień ·
                Przychód opłaconych:{" "}
                <strong className="text-primary">{formatPrice(totalRevenue)}</strong>
              </p>
            </div>

            {/* Preview */}
            <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Brak zamówień w wybranym zakresie.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted text-left">
                    <tr>
                      <th className="px-2 py-2 text-xs font-semibold">ID</th>
                      <th className="px-2 py-2 text-xs font-semibold">Produkt</th>
                      <th className="px-2 py-2 text-xs font-semibold">Klient</th>
                      <th className="px-2 py-2 text-xs font-semibold">Data</th>
                      <th className="px-2 py-2 text-xs font-semibold">Status</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold">Kwota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => {
                      const ship = o.shipping_info ?? {};
                      return (
                        <tr key={o.id} className="border-t border-border">
                          <td className="px-2 py-2 font-mono text-xs text-muted-foreground">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-2 py-2 max-w-[160px] truncate">
                            {o.label ?? o.product_id ?? "—"}{" "}
                            <span className="text-muted-foreground">
                              ×{o.quantity ?? 1}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-muted-foreground">
                            {ship.fullName ?? "—"}
                          </td>
                          <td className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(o.created_at).toLocaleDateString("pl-PL")}
                          </td>
                          <td className="px-2 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                o.status === "PAID" || o.status === "DELIVERED"
                                  ? "bg-emerald-500/15 text-emerald-700"
                                  : o.status === "PENDING"
                                  ? "bg-amber-500/15 text-amber-700"
                                  : o.status === "SHIPPED"
                                  ? "bg-blue-500/15 text-blue-700"
                                  : o.status === "CANCELLED"
                                  ? "bg-red-500/15 text-red-700"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {STATUS_LABELS[o.status] ?? o.status}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right font-semibold text-primary">
                            {formatPrice(o.amount_grosze ?? 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-muted/40">
                    <tr>
                      <td
                        colSpan={5}
                        className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground"
                      >
                        Łączny przychód (opłacone):
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-primary">
                        {formatPrice(totalRevenue ?? 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Wygenerowano: {today} · Zakres: {getDateLabel(range)}
                {range === "custom" && from && ` (${from}`}
                {range === "custom" && to && ` — ${to})`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Zamknij
                </Button>
                <Button onClick={handlePrint} disabled={filtered.length === 0} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Drukuj / Zapisz PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRINT STYLES ===== */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-orders, #print-orders * { visibility: visible !important; }
          #print-orders { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      {/* Hidden printable area */}
      <div id="print-orders" className="hidden print:block">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Wredny Kubek — Zamówienia</h1>
              <p className="text-sm text-gray-500">
                Wydrukowano: {today} · Filtr: {getDateLabel(range)}
                {range === "custom" && from && ` od ${from}`}
                {range === "custom" && to && ` do ${to}`}
              </p>
            </div>
            <p className="text-sm text-gray-500">Liczba: {filtered.length} zam.</p>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={th}>ID</th>
                <th style={th}>Produkt</th>
                <th style={th}>Klient</th>
                <th style={th}>Adres</th>
                <th style={th}>Tel.</th>
                <th style={th}>Data</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: "right" }}>Kwota</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, idx) => {
                const ship = o.shipping_info ?? {};
                return (
                  <tr
                    key={o.id}
                    style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}
                  >
                    <td style={td}>#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td style={td}>
                      {o.label ?? o.product_id ?? "—"} ×{o.quantity ?? 1}
                    </td>
                    <td style={td}>{ship.fullName ?? "—"}</td>
                    <td style={td}>
                      {ship.address ? `${ship.address}, ${ship.zip} ${ship.city}` : "—"}
                    </td>
                    <td style={td}>{ship.phone ?? "—"}</td>
                    <td style={td}>
                      {new Date(o.created_at).toLocaleDateString("pl-PL")}
                    </td>
                    <td style={td}>{STATUS_LABELS[o.status] ?? o.status}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
                      {formatPrice(o.amount_grosze ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f3f4f6", fontWeight: 700 }}>
                <td colSpan={7} style={{ ...td, textAlign: "right" }}>
                  Łączny przychód (opłacone):
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  {formatPrice(totalRevenue ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}

const th: React.CSSProperties = {
  padding: "6px 8px",
  textAlign: "left",
  fontWeight: 600,
  borderBottom: "2px solid #e5e7eb",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
};

const td: React.CSSProperties = {
  padding: "5px 8px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
};
