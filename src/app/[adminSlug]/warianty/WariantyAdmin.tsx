"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CupColorVariant = {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  stock_count: number;
  price_grosze?: number | null;
};

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function WariantyAdmin({ variants }: { variants: CupColorVariant[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function deleteVariant(id: string, name: string) {
    if (!confirm(`Usunąć wariant „${name}"?`)) return;
    setBusy(id);
    try {
      await fetch(`/api/cup-variants/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warianty kubków</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zarządzaj kolorami kubków — dodaj zdjęcie każdego koloru. Te warianty
            będą dostępne do wyboru przy tworzeniu produktu.
          </p>
        </div>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Dodaj kolor
          </Button>
        )}
      </div>

      {showAdd && (
        <AddVariantForm
          onSaved={() => { setShowAdd(false); router.refresh(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {variants.length === 0 && !showAdd && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Brak wariantów. Dodaj pierwszy kolor kubka.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {variants.map((v) => (
          <VariantCard
            key={v.id}
            variant={v}
            busy={busy === v.id}
            onDelete={() => deleteVariant(v.id, v.name)}
            onSaved={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Karta wariantu ────────────────────────────────────────────────────────

function VariantCard({
  variant,
  busy,
  onDelete,
  onSaved,
}: {
  variant: CupColorVariant;
  busy: boolean;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(variant.name);
  const [saving, setSaving] = React.useState(false);
  const [editingStock, setEditingStock] = React.useState(false);
  const [stockVal, setStockVal] = React.useState(String(variant.stock_count));
  const [savingStock, setSavingStock] = React.useState(false);
  const [editingPrice, setEditingPrice] = React.useState(false);
  const [priceVal, setPriceVal] = React.useState(
    variant.price_grosze != null ? (variant.price_grosze / 100).toFixed(2) : "",
  );
  const [savingPrice, setSavingPrice] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  async function savePrice() {
    const raw = priceVal.replace(",", ".").trim();
    const n = raw ? parseFloat(raw) : NaN;
    const priceGrosze = !isNaN(n) && n >= 0 ? Math.round(n * 100) : null;
    setSavingPrice(true);
    try {
      await fetch(`/api/cup-variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceGrosze }),
      });
      onSaved();
    } finally {
      setSavingPrice(false);
      setEditingPrice(false);
    }
  }
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function saveName() {
    if (!name.trim() || name === variant.name) { setEditing(false); return; }
    setSaving(true);
    try {
      await fetch(`/api/cup-variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      onSaved();
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  async function saveStock() {
    const n = parseInt(stockVal, 10);
    if (isNaN(n) || n < 0) { setEditingStock(false); setStockVal(String(variant.stock_count)); return; }
    setSavingStock(true);
    try {
      await fetch(`/api/cup-variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCount: n }),
      });
      onSaved();
    } finally {
      setSavingStock(false);
      setEditingStock(false);
    }
  }

  async function uploadImage(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await fetch("/api/shop-products/upload", { method: "POST", body: fd });
      if (!res.ok) return;
      const { url } = await res.json();
      await fetch(`/api/cup-variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      onSaved();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Zdjęcie */}
      <div className="relative aspect-square bg-muted">
        {variant.image_url ? (
          <Image
            src={variant.image_url}
            alt={variant.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Brak zdjęcia
          </div>
        )}
        {/* Nakładka z przyciskiem uploadu */}
        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          ) : (
            <Upload className="h-7 w-7 text-white drop-shadow" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => uploadImage(e.target.files)}
          />
        </label>
      </div>

      {/* Stan magazynowy */}
      <div className="flex items-center justify-between border-t border-border/50 px-3 py-2 text-xs">
        <span className="text-muted-foreground">Na stanie:</span>
        {editingStock ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="number"
              min={0}
              value={stockVal}
              onChange={(e) => setStockVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveStock();
                if (e.key === "Escape") { setStockVal(String(variant.stock_count)); setEditingStock(false); }
              }}
              className="w-16 rounded border border-input bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button onClick={() => void saveStock()} disabled={savingStock} className="rounded p-0.5 text-primary hover:bg-primary/10">
              {savingStock ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setStockVal(String(variant.stock_count)); setEditingStock(true); }}
            className="flex items-center gap-1 rounded px-1 hover:bg-muted"
          >
            <span className={`font-semibold ${
              variant.stock_count === 0 ? "text-destructive" : "text-foreground"
            }`}>{variant.stock_count} szt.</span>
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Cena koloru (globalna) */}
      <div className="flex items-center justify-between border-t border-border/50 px-3 py-2 text-xs">
        <span className="text-muted-foreground">Cena:</span>
        {editingPrice ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              inputMode="decimal"
              value={priceVal}
              onChange={(e) => setPriceVal(e.target.value)}
              placeholder="bazowa"
              onKeyDown={(e) => {
                if (e.key === "Enter") void savePrice();
                if (e.key === "Escape") setEditingPrice(false);
              }}
              className="w-20 rounded border border-input bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-muted-foreground">zł</span>
            <button onClick={() => void savePrice()} disabled={savingPrice} className="rounded p-0.5 text-primary hover:bg-primary/10">
              {savingPrice ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingPrice(true)}
            className="flex items-center gap-1 rounded px-1 hover:bg-muted"
          >
            <span className="font-semibold text-foreground">
              {variant.price_grosze != null ? `${(variant.price_grosze / 100).toFixed(2)} zł` : "bazowa"}
            </span>
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Nazwa + akcje */}
      <div className="p-3">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveName();
                if (e.key === "Escape") { setName(variant.name); setEditing(false); }
              }}
              className="flex-1 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => void saveName()} disabled={saving} className="rounded p-1 text-primary hover:bg-primary/10">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => { setName(variant.name); setEditing(false); }} className="rounded p-1 hover:bg-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-sm font-semibold">{variant.name}</span>
            <div className="flex shrink-0 items-center gap-0.5">
              <button onClick={() => setEditing(true)} className="rounded p-1 hover:bg-muted" aria-label="Edytuj">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={onDelete} disabled={busy} className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-40" aria-label="Usuń">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Formularz dodawania nowego wariantu ───────────────────────────────────

function AddVariantForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [stockCount, setStockCount] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function uploadImage(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await fetch("/api/shop-products/upload", { method: "POST", body: fd });
      if (!res.ok) { setError("Błąd uploadu zdjęcia."); return; }
      const { url } = await res.json();
      setImageUrl(url);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nazwa jest wymagana."); return; }
    if (stockCount < 0) { setError("Ilość nie może być ujemna."); return; }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/cup-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), imageUrl, stockCount }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Błąd zapisu.");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4">
      <p className="text-sm font-semibold">Nowy kolor kubka</p>

      {/* Podgląd + upload */}
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {imageUrl ? (
            <Image src={imageUrl} alt="podgląd" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-xs text-center px-1">
              Brak zdjęcia
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Wysyłanie..." : "Dodaj zdjęcie kubka"}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadImage(e.target.files)} />
          </label>
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nazwa koloru (np. Biały, Czarny, Różowy)"
              required
              className={inputCls}
            />
            <input
              type="number"
              min={0}
              value={stockCount}
              onChange={(e) => setStockCount(parseInt(e.target.value) || 0)}
              placeholder="Ilość na stanie"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm hover:bg-muted">Anuluj</button>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Dodaj kolor
        </Button>
      </div>
    </form>
  );
}
