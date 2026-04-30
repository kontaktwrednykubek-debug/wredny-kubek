"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export type ShippingMethodRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  price_grosze: number;
  requires_parcel_code: boolean;
  carrier: string | null;
  is_active: boolean;
  sort_order: number;
};

const CARRIERS = [
  { value: "", label: "—" },
  { value: "inpost", label: "InPost" },
  { value: "dpd", label: "DPD" },
  { value: "dhl", label: "DHL" },
  { value: "poczta", label: "Poczta Polska" },
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "kurier", label: "Kurier" },
];

export function ShippingMethodsAdmin({
  methods,
}: {
  methods: ShippingMethodRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function patch(id: string, patch: Partial<ShippingMethodRow>) {
    setBusy(id);
    try {
      const body: Record<string, unknown> = {};
      if ("name" in patch) body.name = patch.name;
      if ("description" in patch) body.description = patch.description;
      if ("price_grosze" in patch) body.priceGrosze = patch.price_grosze;
      if ("requires_parcel_code" in patch)
        body.requiresParcelCode = patch.requires_parcel_code;
      if ("carrier" in patch) body.carrier = patch.carrier;
      if ("is_active" in patch) body.isActive = patch.is_active;
      if ("sort_order" in patch) body.sortOrder = patch.sort_order;

      const res = await fetch(`/api/shipping-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Usunąć tę metodę dostawy?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/shipping-methods/${id}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {methods.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Brak skonfigurowanych metod dostawy. Dodaj pierwszą.
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <MethodRow
              key={m.id}
              method={m}
              onPatch={(patch) => patch && void 0}
              onSave={(updated) => patch(m.id, updated)}
              onDelete={() => remove(m.id)}
              busy={busy === m.id}
            />
          ))}
        </div>
      )}

      {adding ? (
        <NewMethodForm
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Dodaj metodę dostawy
        </Button>
      )}
    </div>
  );
}

function MethodRow({
  method,
  onSave,
  onDelete,
  busy,
}: {
  method: ShippingMethodRow;
  onPatch: (p: Partial<ShippingMethodRow>) => void;
  onSave: (p: Partial<ShippingMethodRow>) => void | Promise<void>;
  onDelete: () => void;
  busy: boolean;
}) {
  const [draft, setDraft] = React.useState({
    name: method.name,
    description: method.description,
    price_grosze: method.price_grosze,
    requires_parcel_code: method.requires_parcel_code,
    carrier: method.carrier ?? "",
    is_active: method.is_active,
    sort_order: method.sort_order,
  });
  const dirty =
    draft.name !== method.name ||
    draft.description !== method.description ||
    draft.price_grosze !== method.price_grosze ||
    draft.requires_parcel_code !== method.requires_parcel_code ||
    (draft.carrier ?? "") !== (method.carrier ?? "") ||
    draft.is_active !== method.is_active ||
    draft.sort_order !== method.sort_order;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-0.5 text-xs">
            {method.code}
          </code>
          <span className="text-xs text-muted-foreground">
            {formatPrice(method.price_grosze)}
          </span>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) =>
              setDraft((d) => ({ ...d, is_active: e.target.checked }))
            }
            className="h-4 w-4 accent-primary"
          />
          Aktywna
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nazwa wyświetlana">
          <input
            value={draft.name}
            onChange={(e) =>
              setDraft((d) => ({ ...d, name: e.target.value }))
            }
            className={inputCls}
          />
        </Field>
        <Field label="Cena (gr)">
          <input
            type="number"
            min={0}
            value={draft.price_grosze}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                price_grosze: parseInt(e.target.value || "0", 10) || 0,
              }))
            }
            className={inputCls}
          />
        </Field>
        <Field label="Opis">
          <input
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            className={inputCls}
          />
        </Field>
        <Field label="Przewoźnik">
          <select
            value={draft.carrier}
            onChange={(e) =>
              setDraft((d) => ({ ...d, carrier: e.target.value }))
            }
            className={inputCls}
          >
            {CARRIERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kolejność (mniej = wyżej)">
          <input
            type="number"
            value={draft.sort_order}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                sort_order: parseInt(e.target.value || "0", 10) || 0,
              }))
            }
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={draft.requires_parcel_code}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                requires_parcel_code: e.target.checked,
              }))
            }
            className="h-4 w-4 accent-primary"
          />
          Wymaga kodu paczkomatu
        </label>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <button
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1 text-sm text-destructive hover:underline disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Usuń
        </button>
        <Button
          size="sm"
          disabled={!dirty || busy}
          onClick={() =>
            onSave({
              name: draft.name,
              description: draft.description,
              price_grosze: draft.price_grosze,
              requires_parcel_code: draft.requires_parcel_code,
              carrier: draft.carrier || null,
              is_active: draft.is_active,
              sort_order: draft.sort_order,
            })
          }
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Zapisz
        </Button>
      </div>
    </div>
  );
}

function NewMethodForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState({
    code: "",
    name: "",
    description: "",
    price_grosze: 0,
    requires_parcel_code: false,
    carrier: "",
    sort_order: 100,
    is_active: true,
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/shipping-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          description: form.description,
          priceGrosze: form.price_grosze,
          requiresParcelCode: form.requires_parcel_code,
          carrier: form.carrier || null,
          isActive: form.is_active,
          sortOrder: form.sort_order,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Nie udało się zapisać.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <h2 className="text-sm font-semibold">Nowa metoda dostawy</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Kod (snake_case, unikalny)">
          <input
            placeholder="np. fedex_kurier"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="Nazwa wyświetlana">
          <input
            placeholder="np. Kurier FedEx"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="Cena (gr)">
          <input
            type="number"
            min={0}
            value={form.price_grosze}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                price_grosze: parseInt(e.target.value || "0", 10) || 0,
              }))
            }
            className={inputCls}
          />
        </Field>
        <Field label="Przewoźnik">
          <select
            value={form.carrier}
            onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
            className={inputCls}
          >
            {CARRIERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Opis">
          <input
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={form.requires_parcel_code}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                requires_parcel_code: e.target.checked,
              }))
            }
            className="h-4 w-4 accent-primary"
          />
          Wymaga kodu paczkomatu
        </label>
      </div>
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          <X className="h-4 w-4" />
          Anuluj
        </Button>
        <Button
          onClick={submit}
          disabled={busy || !form.code || !form.name}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Dodaj
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
