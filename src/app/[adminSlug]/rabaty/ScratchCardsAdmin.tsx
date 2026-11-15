"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Loader2,
  Plus,
  Printer,
  Ticket,
  X,
} from "lucide-react";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import type { DiscountType, ScratchBatch } from "@/lib/discount/types";
import { DISCOUNT_TYPE_NAMES, discountValueLabel } from "@/lib/discount/labels";
import { formatPrice } from "@/lib/utils";

export type ScratchBatchWithStats = ScratchBatch & { total: number; used: number };

type ScratchCode = { id: string; code: string; times_used: number; active: boolean };

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const SCRATCH_TYPES: DiscountType[] = [
  "percent",
  "fixed",
  "second_percent",
  "second_fixed",
  "free_shipping",
  "gift",
];

function formatDate(iso: string | null): string {
  if (!iso) return "bezterminowo";
  return new Date(iso).toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScratchCardsAdmin({ initialBatches }: { initialBatches: ScratchBatchWithStats[] }) {
  const router = useRouter();
  const [batches, setBatches] = React.useState(initialBatches);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => setBatches(initialBatches), [initialBatches]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Ticket className="h-5 w-5 text-primary" />
            Rabaty zdrapki
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pule unikalnych, jednorazowych kodów do zdrapek — każdy kod działa tylko raz.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nowa pula zdrapek
        </Button>
      </div>

      {showForm && (
        <NewScratchBatchForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {batches.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Brak zdrapek. Kliknij „Nowa pula zdrapek”, aby wygenerować kody.
        </div>
      ) : (
        <div className="grid gap-3">
          {batches.map((b) => (
            <BatchCard
              key={b.id}
              batch={b}
              onChanged={() => router.refresh()}
              onDeleted={() => {
                setBatches((prev) => prev.filter((x) => x.id !== b.id));
                router.refresh();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BatchCard({
  batch: b,
  onChanged,
  onDeleted,
}: {
  batch: ScratchBatchWithStats;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [codes, setCodes] = React.useState<ScratchCode[] | null>(null);
  const [copied, setCopied] = React.useState(false);

  const expired = b.valid_until && new Date(b.valid_until) < new Date();
  const exhausted = b.total > 0 && b.used >= b.total;

  async function loadCodes(): Promise<ScratchCode[]> {
    if (codes) return codes;
    const res = await fetch(`/api/admin/scratch-batches/${b.id}`);
    const j = await res.json().catch(() => ({}));
    const items = (j.items ?? []) as ScratchCode[];
    setCodes(items);
    return items;
  }

  async function toggleOpen() {
    if (!open) {
      setBusy(true);
      try {
        await loadCodes();
      } finally {
        setBusy(false);
      }
    }
    setOpen((v) => !v);
  }

  async function toggleActive(active: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/scratch-batches/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setCodes(null);
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/scratch-batches/${b.id}`, { method: "DELETE" });
      if (res.ok) onDeleted();
      else {
        const j = await res.json().catch(() => ({}));
        alert(`Błąd: ${j.error ?? res.statusText}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function downloadCsv() {
    setBusy(true);
    try {
      const items = await loadCodes();
      const lines = ["kod;uzyty"].concat(items.map((c) => `${c.code};${c.times_used > 0 ? "tak" : "nie"}`));
      const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zdrapki-${b.name.replace(/[^\p{L}\p{N}_-]+/gu, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function printCodes() {
    // Okno otwieramy od razu (w obsłudze kliknięcia), żeby nie zablokował go
    // bloker wyskakujących okien — treść wpisujemy po pobraniu kodów.
    const w = window.open("", "_blank");
    if (!w) {
      alert("Przeglądarka zablokowała okno drukowania. Zezwól na wyskakujące okna dla tej strony.");
      return;
    }
    w.document.write("<p style='font-family:sans-serif'>Przygotowuję kody do druku…</p>");
    setBusy(true);
    try {
      const items = await loadCodes();
      const unused = items.filter((c) => c.times_used === 0);
      const esc = (t: string) =>
        t.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
      const reward = esc(discountValueLabel(b.type, b.value, b.gift_description));
      const until = b.valid_until ? `Ważny do ${esc(formatDate(b.valid_until))}` : "";
      const minOrder = b.min_order_grosze != null ? `Min. koszyk ${esc(formatPrice(b.min_order_grosze))}` : "";
      const notes = [until, minOrder].filter(Boolean).join(" · ");
      const cards = unused
        .map(
          (c) => `<div class="card">
  <div class="brand">WREDNY KUBEK</div>
  <div class="reward">${reward}</div>
  <div class="code">${esc(c.code)}</div>
  <div class="hint">Wpisz kod w koszyku na wrednykubek.pl · kod jednorazowy</div>
  ${notes ? `<div class="hint">${notes}</div>` : ""}
</div>`,
        )
        .join("");
      w.document.open();
      w.document.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8">
<title>Zdrapki — ${esc(b.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; margin: 16px; color: #111; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #555; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .card { border: 1px dashed #888; border-radius: 8px; padding: 10px; text-align: center; break-inside: avoid; page-break-inside: avoid; }
  .brand { font-size: 10px; letter-spacing: 2px; font-weight: 700; color: #0f9b8e; }
  .reward { font-size: 13px; font-weight: 600; margin: 4px 0; }
  .code { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 18px; font-weight: 700; letter-spacing: 1px; margin: 6px 0; }
  .hint { font-size: 9px; color: #666; }
  .toolbar { margin-bottom: 12px; }
  .toolbar button { font-size: 14px; padding: 6px 14px; cursor: pointer; }
  @media print { .toolbar { display: none; } body { margin: 8mm; } }
</style></head><body>
<div class="toolbar"><button onclick="window.print()">🖨 Drukuj</button></div>
<h1>${esc(b.name)}</h1>
<div class="meta">${reward} · ${unused.length} nieużytych kodów (z ${items.length})</div>
${unused.length ? `<div class="grid">${cards}</div>` : "<p>Wszystkie kody z tej puli zostały już wykorzystane.</p>"}
</body></html>`);
      w.document.close();
      if (unused.length) setTimeout(() => w.print(), 300);
    } finally {
      setBusy(false);
    }
  }

  async function copyUnused() {
    setBusy(true);
    try {
      const items = await loadCodes();
      const text = items.filter((c) => c.times_used === 0).map((c) => c.code).join("\n");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        !b.active || expired || exhausted ? "border-border bg-muted/30 opacity-80" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{b.name}</span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {discountValueLabel(b.type, b.value, b.gift_description)}
            </span>
            {expired && (
              <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-600">Wygasła</span>
            )}
            {exhausted && (
              <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs text-orange-600">
                Wszystkie użyte
              </span>
            )}
            {!b.active && (
              <span className="rounded-md bg-gray-500/10 px-2 py-0.5 text-xs text-gray-600">Nieaktywna</span>
            )}
          </div>
          <div className="grid gap-x-4 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <div>
              Użyte: <b className="text-foreground">{b.used}</b> / {b.total}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Do: {formatDate(b.valid_until)}
            </div>
            {b.min_order_grosze != null && <div>Min. koszyka: {formatPrice(b.min_order_grosze)}</div>}
            {b.prefix && (
              <div>
                Prefiks: <span className="font-mono">{b.prefix}-</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={b.active}
              disabled={busy}
              onChange={(e) => toggleActive(e.target.checked)}
              className="h-4 w-4"
            />
            Aktywna
          </label>
          <Button variant="outline" size="sm" disabled={busy} onClick={toggleOpen} className="gap-1">
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Kody
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={downloadCsv} className="gap-1">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={printCodes} className="gap-1">
            <Printer className="h-3.5 w-3.5" /> Drukuj
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={copyUnused} className="gap-1">
            <Copy className="h-3.5 w-3.5" /> {copied ? "Skopiowano" : "Kopiuj nieużyte"}
          </Button>
          <ConfirmDeleteButton
            busy={busy}
            onConfirm={remove}
            label="Usuń pulę"
            question={
              b.used > 0
                ? `Usunąć ${b.total} kodów (${b.used} już użytych)?`
                : `Usunąć ${b.total} kodów?`
            }
          />
        </div>
      </div>

      {open && codes && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border bg-background p-2">
          {codes.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">Brak kodów w puli.</p>
          ) : (
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {codes.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between rounded-md px-2 py-1 font-mono text-xs ${
                    c.times_used > 0 ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  <span>{c.code}</span>
                  {c.times_used > 0 && <span className="font-sans no-underline">użyty</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewScratchBatchForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<DiscountType>("percent");
  const [percentValue, setPercentValue] = React.useState("10");
  const [fixedValuePln, setFixedValuePln] = React.useState("10");
  const [giftDescription, setGiftDescription] = React.useState("");
  const [count, setCount] = React.useState("50");
  const [prefix, setPrefix] = React.useState("ZDR");
  const [validFrom, setValidFrom] = React.useState(toLocalInput(new Date().toISOString()));
  const [validUntil, setValidUntil] = React.useState("");
  const [minOrderPln, setMinOrderPln] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isPercent = type === "percent" || type === "second_percent";
  const isFixed = type === "fixed" || type === "second_fixed";
  const isSecond = type === "second_percent" || type === "second_fixed";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Podaj nazwę puli.");
    const n = parseInt(count, 10);
    if (isNaN(n) || n < 1 || n > 2000) return setError("Liczba kodów: 1-2000.");
    if (prefix && !/^[A-Za-z0-9]{1,10}$/.test(prefix)) return setError("Prefiks: do 10 liter/cyfr.");

    let value: number | null = null;
    if (isPercent) {
      value = parseInt(percentValue, 10);
      if (isNaN(value) || value < 1 || value > 100) return setError("Procent musi być 1-100.");
    } else if (isFixed) {
      const f = parseFloat(fixedValuePln.replace(",", "."));
      if (isNaN(f) || f <= 0) return setError("Kwota musi być > 0.");
      value = Math.round(f * 100);
    }
    if (type === "gift" && !giftDescription.trim()) return setError("Opisz, co jest gratisem.");

    const body: Record<string, unknown> = {
      name: name.trim(),
      type,
      value,
      count: n,
      prefix: prefix || null,
      gift_description: type === "gift" ? giftDescription.trim() : null,
    };
    if (validFrom) body.valid_from = new Date(validFrom).toISOString();
    if (validUntil) body.valid_until = new Date(validUntil).toISOString();
    if (minOrderPln) {
      const m = parseFloat(minOrderPln.replace(",", "."));
      if (!isNaN(m) && m > 0) body.min_order_grosze = Math.round(m * 100);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/scratch-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Nie udało się utworzyć puli zdrapek.");
        return;
      }
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Nowa pula zdrapek</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="gap-1">
          <X className="h-4 w-4" /> Anuluj
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Nazwa puli</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Zdrapki — paczki listopad"
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Typ rabatu</span>
          <select value={type} onChange={(e) => setType(e.target.value as DiscountType)} className={inputCls}>
            {SCRATCH_TYPES.map((t) => (
              <option key={t} value={t}>
                {DISCOUNT_TYPE_NAMES[t]}
              </option>
            ))}
          </select>
        </label>

        {isPercent && (
          <label className="block">
            <span className="text-sm font-medium">Procent zniżki</span>
            <input
              type="number"
              min={1}
              max={100}
              value={percentValue}
              onChange={(e) => setPercentValue(e.target.value)}
              className={inputCls}
            />
          </label>
        )}
        {isFixed && (
          <label className="block">
            <span className="text-sm font-medium">Kwota zniżki (zł)</span>
            <input
              type="text"
              inputMode="decimal"
              value={fixedValuePln}
              onChange={(e) => setFixedValuePln(e.target.value)}
              className={inputCls}
            />
          </label>
        )}
      </div>

      {isSecond && (
        <p className="rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          Kod działa przy zakupie min. 2 sztuk. Rabat obejmuje tylko <b>jedną sztukę</b> (najtańszą w koszyku),
          niezależnie od tego, ile sztuk klient kupi.
        </p>
      )}

      {type === "gift" && (
        <label className="block">
          <span className="text-sm font-medium">Co jest gratisem?</span>
          <textarea
            value={giftDescription}
            onChange={(e) => setGiftDescription(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="np. Podkładka pod kubek dorzucona do paczki"
            className={inputCls}
          />
          <span className="text-xs text-muted-foreground">
            Opis zobaczy klient w koszyku, a Ty przy zamówieniu w panelu.
          </span>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Liczba kodów do wygenerowania</span>
          <input
            type="number"
            min={1}
            max={2000}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Prefiks kodu (opcjonalnie)</span>
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            placeholder="ZDR"
            className={`${inputCls} font-mono`}
          />
          <span className="text-xs text-muted-foreground">
            Przykład kodu: <span className="font-mono">{prefix ? `${prefix}-` : ""}K7XM-Q4PA</span>
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium">Ważne od</span>
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ważne do (opcjonalnie)</span>
          <input
            type="datetime-local"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Min. wartość koszyka (zł)</span>
          <input
            type="text"
            inputMode="decimal"
            value={minOrderPln}
            onChange={(e) => setMinOrderPln(e.target.value)}
            placeholder="bez minimum"
            className={inputCls}
          />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Anuluj
        </Button>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Wygeneruj kody
        </Button>
      </div>
    </form>
  );
}
