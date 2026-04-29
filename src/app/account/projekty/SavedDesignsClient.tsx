"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { getProduct } from "@/config/products";

type DesignRow = {
  id: string;
  product_id: string;
  preview_url: string | null;
  created_at: string;
};

export function SavedDesignsClient({ designs }: { designs: DesignRow[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Usunąć ten projekt na stałe?")) return;
    setPending(id);
    try {
      const res = await fetch(`/api/designs/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setPending(null);
    }
  }

  if (!designs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">
          Nie masz jeszcze żadnych zapisanych projektów.
        </p>
        <Link
          href="/edytor"
          className="mt-4 inline-block text-primary underline-offset-4 hover:underline"
        >
          Otwórz edytor →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {designs.map((d) => {
        const product = (() => {
          try {
            return getProduct(d.product_id as never);
          } catch {
            return null;
          }
        })();
        return (
          <article
            key={d.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary hover:shadow-md"
          >
            <Link href={`/edytor?id=${d.id}`} className="block">
              <div className="aspect-square bg-muted">
                {d.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.preview_url}
                    alt={product?.name ?? "Projekt"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Brak podglądu
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium">{product?.name ?? d.product_id}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleString("pl-PL")}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                  <Pencil className="h-3 w-3" />
                  Edytuj
                </p>
              </div>
            </Link>
            <button
              onClick={() => handleDelete(d.id)}
              disabled={pending === d.id}
              aria-label="Usuń projekt"
              className="absolute right-2 top-2 rounded-full bg-background/80 p-2 text-destructive opacity-0 backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        );
      })}
    </div>
  );
}
