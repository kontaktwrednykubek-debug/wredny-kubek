"use client";

import * as React from "react";
import { Loader2, Gift, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export type Promotion = {
  id: string;
  active: boolean;
  buy_qty: number;
  get_qty: number;
  label: string;
};

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function PromoRow({
  promo,
  onUpdated,
  onDeleted,
}: {
  promo: Promotion;
  onUpdated: (p: Promotion) => void;
  onDeleted: (id: string) => void;
}) {
  const [buyQty, setBuyQty] = React.useState(String(promo.buy_qty));
  const [getQty, setGetQty] = React.useState(String(promo.get_qty));
  const [label, setLabel] = React.useState(promo.label);
  const [active, setActive] = React.useState(promo.active);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const isDirty =
    buyQty !== String(promo.buy_qty) ||
    getQty !== String(promo.get_qty) ||
    label !== promo.label ||
    active !== promo.active;

  async function save() {
    setError(null);
    const bq = parseInt(buyQty, 10);
    const gq = parseInt(getQty, 10);
    if (isNaN(bq) || bq < 1) { setError("Kup ile: min. 1."); return; }
    if (isNaN(gq) || gq < 1) { setError("Gratis ile: min. 1."); return; }
    if (!label.trim()) { setError("Etykieta nie może być pusta."); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, buy_qty: bq, get_qty: gq, label: label.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Błąd zapisu.");
        return;
      }
      const { promotion } = await res.json();
      onUpdated(promotion);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Usunąć tę promocję?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/promotions/${promo.id}`, { method: "DELETE" });
      onDeleted(promo.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-5 space-y-4 transition ${
        active ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-border bg-card"
      }`}
    >
      {/* Toggle aktywności */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-3">
          {/* Switch */}
          <div
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              active ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
            onClick={() => setActive((v) => !v)}
            role="switch"
            aria-checked={active}
            tabIndex={0}
            onKeyDown={(e) => e.key === " " && setActive((v) => !v)}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
          <span className="font-semibold">
            {active ? (
              <span className="text-emerald-600 dark:text-emerald-400">Promocja aktywna</span>
            ) : (
              <span className="text-muted-foreground">Promocja wyłączona</span>
            )}
          </span>
        </label>

        <Button
          variant="ghost"
          size="sm"
          disabled={deleting}
          onClick={remove}
          className="gap-1 text-red-600 hover:bg-red-50"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Usuń
        </Button>
      </div>

      {/* Podgląd reguły */}
      <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        Kup{" "}
        <span className="font-bold text-foreground">{buyQty || "?"}</span>{" "}
        sztuki → dostaniesz{" "}
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {getQty || "?"} gratis
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium">Kup ile (buy)</span>
          <input
            type="number"
            min={1}
            max={99}
            value={buyQty}
            onChange={(e) => setBuyQty(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Gratis ile (get)</span>
          <input
            type="number"
            min={1}
            max={99}
            value={getQty}
            onChange={(e) => setGetQty(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block sm:col-span-1 col-span-full">
          <span className="text-sm font-medium">Etykieta (widoczna w koszyku)</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputCls}
            placeholder="Kup 3, dostaniesz 4. gratis!"
          />
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          onClick={save}
          disabled={saving || !isDirty}
          className="gap-2"
          size="sm"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Zapisuję…" : "Zapisz zmiany"}
        </Button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            ✓ Zapisano!
          </span>
        )}
        {isDirty && !saved && !saving && (
          <span className="text-xs text-muted-foreground">Masz niezapisane zmiany</span>
        )}
      </div>
    </div>
  );
}

export function PromotionsAdmin({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const router = useRouter();
  const [promos, setPromos] = React.useState<Promotion[]>(initialPromotions);
  const [creating, setCreating] = React.useState(false);

  async function createPromo() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false, buy_qty: 3, get_qty: 1, label: "Kup 3, dostaniesz 4. gratis!" }),
      });
      if (res.ok) {
        const { promotion } = await res.json();
        setPromos((prev) => [...prev, promotion]);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Gift className="h-5 w-5 text-emerald-500" />
            Promocje automatyczne
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reguły "kup X, dostaniesz Y gratis" — stosowane automatycznie w koszyku.
          </p>
        </div>
        <Button
          onClick={createPromo}
          disabled={creating}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Dodaj promocję
        </Button>
      </div>

      {promos.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Brak promocji automatycznych. Kliknij „Dodaj promocję" aby stworzyć pierwszą.
        </div>
      )}

      <div className="space-y-3">
        {promos.map((p) => (
          <PromoRow
            key={p.id}
            promo={p}
            onUpdated={(updated) =>
              setPromos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
            }
            onDeleted={(id) => setPromos((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
