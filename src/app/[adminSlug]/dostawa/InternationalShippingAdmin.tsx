"use client";

import * as React from "react";
import { Loader2, Plus, Trash2, Globe, Package, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

type CountryMethod = {
  id: string;
  name: string;
  carrier: string | null;
  price_grosze: number;
  requires_parcel_code: boolean;
  is_active: boolean;
};

type Country = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  methods: CountryMethod[];
};

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function InternationalShippingAdmin() {
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shipping-countries", { cache: "no-store" });
      const data = await res.json();
      setCountries(data.countries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function addCountry(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/shipping-countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name }),
      });
      if (res.ok) {
        setCode("");
        setName("");
        await load();
      }
    } finally {
      setAdding(false);
    }
  }

  async function deleteCountry(id: string) {
    if (!confirm("Usunąć ten kraj i wszystkie jego metody wysyłki?")) return;
    await fetch(`/api/admin/shipping-countries/${id}`, { method: "DELETE" });
    setCountries((prev) => prev.filter((c) => c.id !== id));
  }

  async function toggleCountry(id: string, active: boolean) {
    await fetch(`/api/admin/shipping-countries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: active }),
    });
    setCountries((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: active } : c)));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Globe className="h-5 w-5 text-primary" />
          Przesyłki zagraniczne
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Dodaj kraje wysyłki, a do każdego metody (kurier, paczkomat). Klient w
          koszyku wybiera kraj → potem metodę. Polskę konfigurujesz powyżej.
        </p>
      </div>

      {/* Dodawanie kraju */}
      <form onSubmit={addCountry} className="flex flex-wrap items-end gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <label className="block w-24">
          <span className="text-xs font-medium">Kod</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DE"
            maxLength={3}
            className={`${inputCls} uppercase`}
          />
        </label>
        <label className="block flex-1 min-w-[160px]">
          <span className="text-xs font-medium">Nazwa kraju</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Niemcy" className={inputCls} />
        </label>
        <Button type="submit" disabled={adding} className="gap-2">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Dodaj kraj
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : countries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Brak krajów zagranicznych. Dodaj pierwszy powyżej.
        </div>
      ) : (
        <div className="space-y-4">
          {countries.map((c) => (
            <CountryCard
              key={c.id}
              country={c}
              onDelete={() => deleteCountry(c.id)}
              onToggle={(a) => toggleCountry(c.id, a)}
              onReload={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CountryCard({
  country,
  onDelete,
  onToggle,
  onReload,
}: {
  country: Country;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
  onReload: () => Promise<void>;
}) {
  const [mName, setMName] = React.useState("");
  const [mPrice, setMPrice] = React.useState("");
  const [mParcel, setMParcel] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // Edycja danych kraju (kod + nazwa)
  const [editingCountry, setEditingCountry] = React.useState(false);
  const [cCode, setCCode] = React.useState(country.code);
  const [cName, setCName] = React.useState(country.name);

  async function saveCountry() {
    await fetch(`/api/admin/shipping-countries/${country.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: cCode.trim().toUpperCase(), name: cName.trim() }),
    });
    setEditingCountry(false);
    await onReload();
  }

  async function addMethod(e: React.FormEvent) {
    e.preventDefault();
    if (!mName.trim()) return;
    const price = parseFloat(mPrice.replace(",", ".")) || 0;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/shipping-countries/${country.id}/methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mName.trim(),
          price_grosze: Math.round(price * 100),
          requires_parcel_code: mParcel,
        }),
      });
      if (res.ok) {
        setMName("");
        setMPrice("");
        setMParcel(false);
        await onReload();
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteMethod(id: string) {
    await fetch(`/api/admin/shipping-country-methods/${id}`, { method: "DELETE" });
    await onReload();
  }

  return (
    <div className={`rounded-2xl border p-4 ${country.is_active ? "border-border bg-card" : "border-border bg-muted/40 opacity-70"}`}>
      <div className="flex items-center justify-between gap-3">
        {editingCountry ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={cCode}
              onChange={(e) => setCCode(e.target.value.toUpperCase())}
              maxLength={3}
              className={`${inputCls} w-20 uppercase`}
            />
            <input
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              className={`${inputCls} flex-1`}
            />
            <Button size="sm" onClick={saveCountry} className="gap-1">
              <Check className="h-3.5 w-3.5" /> Zapisz
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCCode(country.code);
                setCName(country.name);
                setEditingCountry(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                {country.code}
              </span>
              <span className="font-semibold">{country.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={country.is_active}
                  onChange={(e) => onToggle(e.target.checked)}
                  className="h-4 w-4"
                />
                Aktywny
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingCountry(true)}
                className="gap-1"
              >
                <Pencil className="h-3.5 w-3.5" /> Edytuj
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="gap-1 text-red-600 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Usuń
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Metody wysyłki dla tego kraju */}
      <div className="mt-3 space-y-2 border-t border-border pt-3">
        {country.methods.length === 0 ? (
          <p className="text-xs text-muted-foreground">Brak metod — dodaj poniżej.</p>
        ) : (
          country.methods.map((m) => (
            <MethodRow key={m.id} method={m} onReload={onReload} onDelete={() => deleteMethod(m.id)} />
          ))
        )}

        {/* Formularz dodawania metody */}
        <form onSubmit={addMethod} className="flex flex-wrap items-end gap-2 pt-1">
          <label className="block flex-1 min-w-[140px]">
            <span className="text-xs font-medium">Nazwa metody</span>
            <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Kurier DPD" className={inputCls} />
          </label>
          <label className="block w-28">
            <span className="text-xs font-medium">Cena (zł)</span>
            <input value={mPrice} onChange={(e) => setMPrice(e.target.value)} inputMode="decimal" placeholder="49.99" className={inputCls} />
          </label>
          <label className="flex items-center gap-1.5 pb-2 text-xs">
            <input type="checkbox" checked={mParcel} onChange={(e) => setMParcel(e.target.checked)} className="h-4 w-4" />
            Paczkomat
          </label>
          <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Dodaj metodę
          </Button>
        </form>
      </div>
    </div>
  );
}

function MethodRow({
  method,
  onReload,
  onDelete,
}: {
  method: CountryMethod;
  onReload: () => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(method.name);
  const [price, setPrice] = React.useState((method.price_grosze / 100).toFixed(2));
  const [parcel, setParcel] = React.useState(method.requires_parcel_code);
  const [active, setActive] = React.useState(method.is_active);
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/admin/shipping-country-methods/${method.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price_grosze: Math.round((parseFloat(price.replace(",", ".")) || 0) * 100),
          requires_parcel_code: parcel,
          is_active: active,
        }),
      });
      setEditing(false);
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-primary/40 bg-primary/5 p-2.5">
        <label className="block flex-1 min-w-[140px]">
          <span className="text-xs font-medium">Nazwa</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>
        <label className="block w-24">
          <span className="text-xs font-medium">Cena (zł)</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className={inputCls} />
        </label>
        <label className="flex items-center gap-1.5 pb-2 text-xs">
          <input type="checkbox" checked={parcel} onChange={(e) => setParcel(e.target.checked)} className="h-4 w-4" />
          Paczkomat
        </label>
        <label className="flex items-center gap-1.5 pb-2 text-xs">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
          Aktywna
        </label>
        <Button size="sm" onClick={save} disabled={busy} className="gap-1">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Zapisz
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 ${
        method.is_active ? "" : "opacity-60"
      }`}
    >
      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {method.name}
          {!method.is_active && <span className="ml-2 text-xs text-muted-foreground">(wyłączona)</span>}
        </p>
        {method.requires_parcel_code && (
          <p className="text-xs text-muted-foreground">wymaga kodu punktu odbioru</p>
        )}
      </div>
      <span className="shrink-0 text-sm font-bold text-primary">{formatPrice(method.price_grosze)}</span>
      <button
        onClick={() => setEditing(true)}
        aria-label="Edytuj metodę"
        className="rounded-full p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={onDelete}
        aria-label="Usuń metodę"
        className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
