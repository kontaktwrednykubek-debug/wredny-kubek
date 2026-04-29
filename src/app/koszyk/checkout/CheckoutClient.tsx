"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart, cartTotalGr } from "@/features/cart/useCart";
import { formatPrice } from "@/lib/utils";
import { isValidPhone } from "@/lib/phone";

export type CheckoutShippingMethod = {
  code: string;
  name: string;
  description: string;
  priceGrosze: number;
  requiresParcelCode: boolean;
};

export function CheckoutClient({
  methods,
}: {
  methods: CheckoutShippingMethod[];
}) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [zipError, setZipError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    parcelCode: "",
    note: "",
  });
  const [shippingMethod, setShippingMethod] = React.useState<string>(
    methods[0]?.code ?? "",
  );

  React.useEffect(() => {
    if (items.length === 0) {
      router.replace("/koszyk");
    }
  }, [items.length, router]);

  if (items.length === 0) return null;

  const itemsTotal = cartTotalGr(items);
  const method = methods.find((m) => m.code === shippingMethod);
  const shippingPrice = method?.priceGrosze ?? 0;
  const total = itemsTotal + shippingPrice;
  const requiresParcelCode = method?.requiresParcelCode ?? false;

  function validatePhone(value: string) {
    if (!value) return setPhoneError(null);
    setPhoneError(
      isValidPhone(value)
        ? null
        : "Nieprawidłowy numer. Przykłady: 600 100 200, +48 600 100 200, +41 78 206 73 79.",
    );
  }
  function validateZip(value: string) {
    if (!value) return setZipError(null);
    setZipError(
      /^\d{2}-\d{3}$/.test(value) ? null : "Format: 00-000 (np. 02-345).",
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidPhone(form.phone)) {
      setPhoneError("Nieprawidłowy numer telefonu.");
      return;
    }
    if (!/^\d{2}-\d{3}$/.test(form.zip)) {
      setZipError("Kod pocztowy w formacie 00-000.");
      return;
    }
    if (requiresParcelCode && !form.parcelCode.trim()) {
      setError("Wpisz kod paczkomatu lub punktu odbioru.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: {
            fullName: form.fullName,
            phone: form.phone,
            address: form.address,
            city: form.city,
            zip: form.zip,
            shippingMethod,
            parcelCode: form.parcelCode || undefined,
            note: form.note || undefined,
          },
          items: items.map((i) => ({
            designId: i.designId,
            productId: i.productId,
            quantity: i.quantity,
            unitPriceGr: i.unitPriceGr,
            previewUrl: i.previewUrl ?? null,
          })),
        }),
      });
      if (res.status === 401) {
        router.push("/login?next=/koszyk/checkout");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Nie udało się złożyć zamówienia");
        return;
      }
      const { orderId } = await res.json();
      clear();
      router.push(`/account/zamowienia?ok=${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zamówienia");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <section className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Zamówienie</h1>
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dane do wysyłki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Imię i nazwisko
                </span>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  className={inputCls}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Telefon</span>
                <input
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="600 100 200"
                  value={form.phone}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, phone: e.target.value }));
                    validatePhone(e.target.value);
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  className={`${inputCls} ${
                    phoneError ? "border-destructive" : ""
                  }`}
                  aria-invalid={Boolean(phoneError)}
                />
                {phoneError && (
                  <span className="mt-1 block text-xs text-destructive">
                    {phoneError}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Adres (ulica, nr)
                </span>
                <input
                  required
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className={inputCls}
                />
              </label>

              <div className="grid grid-cols-[1fr_140px] gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Miasto</span>
                  <input
                    required
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Kod pocztowy
                  </span>
                  <input
                    required
                    placeholder="00-000"
                    value={form.zip}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, zip: e.target.value }));
                      validateZip(e.target.value);
                    }}
                    onBlur={(e) => validateZip(e.target.value)}
                    className={`${inputCls} ${
                      zipError ? "border-destructive" : ""
                    }`}
                  />
                </label>
              </div>
              {zipError && (
                <p className="-mt-2 text-xs text-destructive">{zipError}</p>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Uwagi do zamówienia (opcjonalne)
                </span>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  className={inputCls}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Sposób dostawy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {methods.length === 0 && (
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Brak dostępnych metod dostawy. Skontaktuj się z obsługą.
                </p>
              )}
              {methods.map((m) => {
                const checked = shippingMethod === m.code;
                return (
                  <label
                    key={m.code}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                      checked
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={m.code}
                        checked={checked}
                        onChange={() => setShippingMethod(m.code)}
                        className="mt-1 h-4 w-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-semibold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.description}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-primary">
                      {m.priceGrosze === 0 ? "Gratis" : formatPrice(m.priceGrosze)}
                    </span>
                  </label>
                );
              })}

              {requiresParcelCode && (
                <label className="block pt-2">
                  <span className="mb-1 block text-sm font-medium">
                    Kod paczkomatu / punktu odbioru
                  </span>
                  <input
                    required
                    placeholder="np. WAW123M"
                    value={form.parcelCode}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, parcelCode: e.target.value }))
                    }
                    className={inputCls}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Znajdziesz na{" "}
                    <a
                      href="https://inpost.pl/znajdz-paczkomat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      inpost.pl/znajdz-paczkomat
                    </a>
                  </span>
                </label>
              )}
            </CardContent>
          </Card>

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Podsumowanie
          </h2>
          <ul className="space-y-1 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="truncate">
                  {i.label} ×{i.quantity}
                </span>
                <span className="shrink-0">
                  {formatPrice(i.unitPriceGr * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Produkty</span>
            <span>{formatPrice(itemsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Dostawa ({method?.name})
            </span>
            <span>
              {shippingPrice === 0 ? "Gratis" : formatPrice(shippingPrice)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
            <span>Razem</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || Boolean(phoneError) || Boolean(zipError)}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Złóż zamówienie
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Zamówienie zostanie utworzone ze statusem „oczekujące". Płatność —
            wkrótce (Stripe).
          </p>
        </aside>
      </form>
    </section>
  );
}
