"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Music2, Search, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export type AdminProduct = {
  slug: string;
  title: string;
  price_grosze: number;
  images: string[] | null;
};

type LinkedProduct = AdminProduct;

type TikTokRow = {
  id: string;
  tiktok_url: string;
  video_id: string;
  thumbnail_url: string | null;
  title: string | null;
  author: string | null;
  is_active: boolean;
  sort_order: number;
  products: LinkedProduct[];
};

const MAX_PRODUCTS = 2;

export function SocialAdmin({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [rows, setRows] = React.useState<TikTokRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Formularz dodawania
  const [url, setUrl] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tiktoks", { cache: "no-store" });
      const data = await res.json();
      setRows(data.tiktoks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function addTiktok(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("Wklej link do TikToka.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/tiktoks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiktok_url: url.trim(), product_slugs: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się dodać filmu.");
        return;
      }
      setUrl("");
      setSelected([]);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function removeTiktok(id: string) {
    if (!confirm("Usunąć ten film z karuzeli?")) return;
    await fetch(`/api/admin/tiktoks/${id}`, { method: "DELETE" });
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/tiktoks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: active }),
    });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: active } : r)));
  }

  async function updateProducts(id: string, slugs: string[]) {
    await fetch(`/api/admin/tiktoks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_slugs: slugs }),
    });
    await load();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* FORMULARZ DODAWANIA */}
      <form onSubmit={addTiktok} className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Dodaj film z TikToka
        </h2>

        <label className="block">
          <span className="text-sm font-medium">Link do filmu</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@konto/video/7281234567890123456"
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            W aplikacji TikTok: Udostępnij → Kopiuj link. Okładka pobierze się sama.
          </span>
        </label>

        <div>
          <span className="text-sm font-medium">
            Powiązane produkty <span className="text-muted-foreground">(max {MAX_PRODUCTS})</span>
          </span>
          <ProductPicker
            products={products}
            selected={selected}
            onChange={setSelected}
            max={MAX_PRODUCTS}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {submitting ? "Pobieram dane z TikToka…" : "Dodaj film"}
        </Button>
      </form>

      {/* LISTA FILMÓW */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Brak filmów. Dodaj pierwszy powyżej.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Filmów: <span className="font-semibold text-foreground">{rows.length}</span>
          </p>
          {rows.map((row) => (
            <TikTokCard
              key={row.id}
              row={row}
              products={products}
              onRemove={() => removeTiktok(row.id)}
              onToggle={(a) => toggleActive(row.id, a)}
              onUpdateProducts={(slugs) => updateProducts(row.id, slugs)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TikTokCard({
  row,
  products,
  onRemove,
  onToggle,
  onUpdateProducts,
}: {
  row: TikTokRow;
  products: AdminProduct[];
  onRemove: () => void;
  onToggle: (active: boolean) => void;
  onUpdateProducts: (slugs: string[]) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>(row.products.map((p) => p.slug));

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row ${
        row.is_active ? "border-border bg-card" : "border-border bg-muted/40 opacity-70"
      }`}
    >
      <GripVertical className="hidden h-5 w-5 shrink-0 self-center text-muted-foreground sm:block" />

      {/* Miniatura */}
      <div className="relative h-32 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        {row.thumbnail_url ? (
          <Image src={row.thumbnail_url} alt={row.title ?? "TikTok"} fill className="object-cover" unoptimized />
        ) : (
          <div className="grid h-full place-items-center">
            <Music2 className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {row.author && <p className="text-sm font-semibold text-primary">@{row.author}</p>}
        {row.title && <p className="line-clamp-2 text-sm text-muted-foreground">{row.title}</p>}
        <a
          href={row.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {row.tiktok_url}
        </a>

        {/* Powiązane produkty */}
        {!editing ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {row.products.length === 0 ? (
              <span className="text-xs text-muted-foreground">Brak powiązanych produktów</span>
            ) : (
              row.products.map((p) => (
                <span key={p.slug} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {p.title} · {formatPrice(p.price_grosze)}
                </span>
              ))
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Edytuj produkty
            </button>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-border bg-background p-3">
            <ProductPicker products={products} selected={selected} onChange={setSelected} max={MAX_PRODUCTS} />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onUpdateProducts(selected);
                  setEditing(false);
                }}
              >
                Zapisz produkty
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Anuluj
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Akcje */}
      <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={row.is_active}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4"
          />
          Aktywny
        </label>
        <Button variant="outline" size="sm" onClick={onRemove} className="gap-1 text-red-600 hover:bg-red-50">
          <Trash2 className="h-3.5 w-3.5" /> Usuń
        </Button>
      </div>
    </div>
  );
}

function ProductPicker({
  products,
  selected,
  onChange,
  max,
}: {
  products: AdminProduct[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  max: number;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = query.trim()
    ? products.filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()))
    : products.slice(0, 8);

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else if (selected.length < max) {
      onChange([...selected, slug]);
    }
  };

  const selectedProducts = selected
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is AdminProduct => Boolean(p));

  return (
    <div className="mt-1 space-y-2">
      {/* Wybrane */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((p) => (
            <span
              key={p.slug}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {p.title}
              <button type="button" onClick={() => toggle(p.slug)} aria-label="Usuń">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length < max && (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj produktu…"
              className="w-full rounded-xl border border-input bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border bg-background p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">Brak wyników</p>
            ) : (
              filtered.map((p) => {
                const cover = p.images?.[0];
                const isSel = selected.includes(p.slug);
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => toggle(p.slug)}
                    disabled={isSel}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-muted disabled:opacity-50"
                  >
                    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                      {cover && <Image src={cover} alt={p.title} fill className="object-cover" unoptimized />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{p.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatPrice(p.price_grosze)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
