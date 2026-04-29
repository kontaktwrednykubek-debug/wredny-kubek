"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart, cartTotalGr } from "@/features/cart/useCart";
import { formatPrice } from "@/lib/utils";

export function CheckoutClient() {
  const router = useRouter();
  const { items, clear } = useCart();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });

  React.useEffect(() => {
    if (items.length === 0) {
      router.replace("/koszyk");
    }
  }, [items.length, router]);

  if (items.length === 0) return null;

  const total = cartTotalGr(items);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: form,
          items: items.map((i) => ({
            designId: i.designId,
            productId: i.productId,
            quantity: i.quantity,
            unitPriceGr: i.unitPriceGr,
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

  function field<K extends keyof typeof form>(key: K, label: string, type = "text") {
    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{label}</span>
        <input
          type={type}
          required
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
    );
  }

  return (
    <section className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Zamówienie</h1>
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Dane do wysyłki</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {field("fullName", "Imię i nazwisko")}
            {field("phone", "Telefon", "tel")}
            {field("address", "Adres (ulica, nr)")}
            <div className="grid grid-cols-[1fr_120px] gap-3">
              {field("city", "Miasto")}
              {field("zip", "Kod pocztowy")}
            </div>
            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Podsumowanie
          </h2>
          <ul className="space-y-1 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span className="truncate">
                  {i.label} ×{i.quantity}
                </span>
                <span>{formatPrice(i.unitPriceGr * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
            <span>Razem</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
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
