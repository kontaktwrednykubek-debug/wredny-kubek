"use client";

import * as React from "react";
import { Loader2, Save, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MysteryMug = {
  id: string;
  enabled: boolean;
  price_grosze: number;
  label: string;
  description: string;
  image_url: string | null;
};

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function MysteryMugAdmin({ initial }: { initial: MysteryMug | null }) {
  const [enabled, setEnabled] = React.useState(initial?.enabled ?? false);
  const [pricePln, setPricePln] = React.useState(
    ((initial?.price_grosze ?? 2000) / 100).toFixed(2),
  );
  const [label, setLabel] = React.useState(initial?.label ?? "Kubek w ciemno (losowy wzór)");
  const [description, setDescription] = React.useState(
    initial?.description ?? "Zaskocz się! Wylosujemy dla Ciebie kubek 330 ml z naszej kolekcji.",
  );
  const [imageUrl, setImageUrl] = React.useState(initial?.image_url ?? "");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setError(null);
    const price = parseFloat(pricePln.replace(",", "."));
    if (isNaN(price) || price < 0) {
      setError("Podaj poprawną cenę.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mystery-mug", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          price_grosze: Math.round(price * 100),
          label: label.trim(),
          description: description.trim(),
          image_url: imageUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Błąd zapisu.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Gift className="h-5 w-5 text-primary" />
          Kubek w ciemno (dokupka w koszyku)
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Haczyk w koszyku: klient może dokupić losowy kubek jednym kliknięciem.
        </p>
      </div>

      <div
        className={`space-y-4 rounded-2xl border p-5 ${
          enabled ? "border-primary/40 bg-primary/5" : "border-border bg-card"
        }`}
      >
        {/* Switch */}
        <label className="flex cursor-pointer items-center gap-3">
          <div
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
            }`}
            onClick={() => setEnabled((v) => !v)}
            role="switch"
            aria-checked={enabled}
            tabIndex={0}
            onKeyDown={(e) => e.key === " " && setEnabled((v) => !v)}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
          <span className="font-semibold">
            {enabled ? "Widoczny w koszyku" : "Ukryty"}
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Cena (zł)</span>
            <input
              type="text"
              inputMode="decimal"
              value={pricePln}
              onChange={(e) => setPricePln(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nazwa</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Opis (krótki)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">URL zdjęcia (opcjonalne)</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… (puste = ikona prezentu)"
            className={inputCls}
          />
        </label>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving} size="sm" className="gap-2">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Zapisz
          </Button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              ✓ Zapisano!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
