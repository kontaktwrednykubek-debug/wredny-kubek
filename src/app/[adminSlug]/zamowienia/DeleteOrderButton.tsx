"use client";

import * as React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteOrderButton({
  orderId,
  orderIds,
  orderLabel,
}: {
  orderId: string;
  orderIds?: string[];
  orderLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const allIds = orderIds && orderIds.length > 0 ? orderIds : [orderId];

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        allIds.map((oid) =>
          fetch(`/api/admin/orders/${oid}`, { method: "DELETE" }),
        ),
      );
      const failed = results.find((r) => !r.ok);
      if (failed) {
        const data = await failed.json().catch(() => ({}));
        throw new Error(data.error ?? "Błąd usuwania");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Usuń zamówienie"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Usuń
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-semibold">Usuń zamówienie?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {orderLabel}
                  </span>{" "}
                  <code className="font-mono text-xs">
                    #{orderId.slice(0, 8).toUpperCase()}
                  </code>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tej operacji nie można cofnąć.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {loading ? "Usuwanie…" : "Usuń na zawsze"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
