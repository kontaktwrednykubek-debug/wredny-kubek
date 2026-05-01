"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X, Calendar, Tag, Percent, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiscountCode, DiscountType } from "@/lib/discount/types";
import { formatPrice } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  // format yyyy-MM-ddTHH:mm (local)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(s: string): string | null {
  if (!s) return null;
  return new Date(s).toISOString();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeLabel(t: DiscountType, value: number | null): string {
  if (t === "percent") return `-${value ?? 0}%`;
  if (t === "fixed") return `-${formatPrice(value ?? 0)}`;
  return "Darmowa dostawa";
}

function typeIcon(t: DiscountType) {
  if (t === "percent") return <Percent className="h-4 w-4" />;
  if (t === "fixed") return <Tag className="h-4 w-4" />;
  return <Truck className="h-4 w-4" />;
}

export function DiscountCodesAdmin({
  initialCodes,
}: {
  initialCodes: DiscountCode[];
}) {
  const router = useRouter();
  const [codes, setCodes] = React.useState<DiscountCode[]>(initialCodes);
  const [showForm, setShowForm] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCodes(initialCodes);
  }, [initialCodes]);

  async function toggleActive(id: string, active: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/discount-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Usunąć ten kod? Tej operacji nie da się cofnąć (Stripe Coupon też zostanie usunięty).")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/discount-codes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCodes((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        alert(`Błąd: ${j.error ?? res.statusText}`);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Łącznie kodów: <span className="font-semibold text-foreground">{codes.length}</span>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nowy kod
        </Button>
      </div>

      {showForm && (
        <NewDiscountForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {codes.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Brak kodów rabatowych. Kliknij „Nowy kod” aby dodać pierwszy.
        </div>
      ) : (
        <div className="grid gap-3">
          {codes.map((c) => {
            const expired = c.valid_until && new Date(c.valid_until) < new Date();
            const exhausted = c.max_uses != null && c.times_used >= c.max_uses;
            return (
              <div
                key={c.id}
                className={`rounded-xl border p-4 ${
                  !c.active || expired || exhausted
                    ? "border-border bg-muted/30 opacity-70"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                        {c.code}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        {typeIcon(c.type)}
                        {typeLabel(c.type, c.value)}
                      </span>
                      {expired && (
                        <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-600">
                          Wygasł
                        </span>
                      )}
                      {exhausted && (
                        <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs text-orange-600">
                          Wyczerpany
                        </span>
                      )}
                      {!c.active && (
                        <span className="rounded-md bg-gray-500/10 px-2 py-0.5 text-xs text-gray-600">
                          Nieaktywny
                        </span>
                      )}
                    </div>

                    <div className="grid gap-x-4 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Od: {formatDate(c.valid_from)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Do: {formatDate(c.valid_until)}
                      </div>
                      <div>
                        Użyć: <b>{c.times_used}</b>
                        {c.max_uses != null ? ` / ${c.max_uses}` : " / ∞"}
                      </div>
                      {c.min_order_grosze != null && (
                        <div>Min. koszyka: {formatPrice(c.min_order_grosze)}</div>
                      )}
                      {c.one_per_user && <div>1× per użytkownik</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.active}
                        disabled={busy === c.id}
                        onChange={(e) => toggleActive(c.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                      Aktywny
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy === c.id}
                      onClick={() => remove(c.id)}
                      className="gap-1 text-red-600 hover:bg-red-50"
                    >
                      {busy === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Usuń
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewDiscountForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<DiscountType>("percent");
  const [percentValue, setPercentValue] = React.useState("10");
  const [fixedValuePln, setFixedValuePln] = React.useState("10");
  const [validFrom, setValidFrom] = React.useState(toLocalInput(new Date().toISOString()));
  const [validUntil, setValidUntil] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("");
  const [minOrderPln, setMinOrderPln] = React.useState("");
  const [onePerUser, setOnePerUser] = React.useState(false);
  const [active, setActive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.match(/^[A-Za-z0-9_-]+$/) || code.length < 3) {
      setError("Kod: min. 3 znaki, tylko litery, cyfry, _ i -.");
      return;
    }

    let value: number | null = null;
    if (type === "percent") {
      value = parseInt(percentValue, 10);
      if (isNaN(value) || value < 1 || value > 100) {
        setError("Procent musi być 1-100.");
        return;
      }
    } else if (type === "fixed") {
      const f = parseFloat(fixedValuePln.replace(",", "."));
      if (isNaN(f) || f <= 0) {
        setError("Kwota musi być > 0.");
        return;
      }
      value = Math.round(f * 100);
    }

    const body: Record<string, unknown> = {
      code: code.toUpperCase(),
      type,
      value,
      active,
      one_per_user: onePerUser,
    };
    if (validFrom) body.valid_from = fromLocalInput(validFrom);
    if (validUntil) body.valid_until = fromLocalInput(validUntil);
    if (maxUses) body.max_uses = parseInt(maxUses, 10);
    if (minOrderPln) {
      const m = parseFloat(minOrderPln.replace(",", "."));
      if (!isNaN(m) && m > 0) body.min_order_grosze = Math.round(m * 100);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Nie udało się utworzyć kodu.");
        return;
      }
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Nowy kod rabatowy</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="gap-1">
          <X className="h-4 w-4" /> Anuluj
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Kod</span>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WIOSNA10"
            className={`${inputCls} font-mono`}
          />
          <span className="text-xs text-muted-foreground">3-40 znaków, litery, cyfry, _ i -</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Typ rabatu</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DiscountType)}
            className={inputCls}
          >
            <option value="percent">Procentowy (%)</option>
            <option value="fixed">Kwotowy (zł)</option>
            <option value="free_shipping">Darmowa dostawa</option>
          </select>
        </label>

        {type === "percent" && (
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
        {type === "fixed" && (
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Ważny od</span>
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ważny do (opcjonalnie)</span>
          <input
            type="datetime-local"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className={inputCls}
          />
          <span className="text-xs text-muted-foreground">Puste = bezterminowo</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Max użyć globalnie</span>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="bez limitu"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Minimalna wartość koszyka (zł)</span>
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

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={onePerUser}
            onChange={(e) => setOnePerUser(e.target.checked)}
            className="h-4 w-4"
          />
          Jeden użytek per klient
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4"
          />
          Aktywny
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Anuluj
        </Button>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Utwórz kod
        </Button>
      </div>
    </form>
  );
}
