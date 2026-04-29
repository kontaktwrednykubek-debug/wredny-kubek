"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, cartTotalGr } from "@/features/cart/useCart";
import { formatPrice } from "@/lib/utils";

export function CartClient() {
  const { items, setQuantity, remove, clear } = useCart();

  if (items.length === 0) {
    return (
      <section className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-3xl font-bold">Twój koszyk jest pusty</h1>
        <p className="mt-3 text-muted-foreground">
          Stwórz swój pierwszy projekt w edytorze.
        </p>
        <Link href="/edytor" className="mt-6 inline-block">
          <Button size="lg">Otwórz edytor</Button>
        </Link>
      </section>
    );
  }

  const total = cartTotalGr(items);

  return (
    <section className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Twój koszyk</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {item.previewUrl ? (
                  <Image
                    src={item.previewUrl}
                    alt={item.label}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    brak
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.unitPriceGr)} / szt.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                    aria-label="Mniej"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                    aria-label="Więcej"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {formatPrice(item.unitPriceGr * item.quantity)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(item.id)}
                  aria-label="Usuń"
                  className="mt-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <button
            onClick={clear}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Wyczyść koszyk
          </button>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Podsumowanie
          </h2>
          <div className="mt-3 flex justify-between text-sm">
            <span>Produkty ({items.length})</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span>Dostawa</span>
            <span className="text-muted-foreground">na następnym kroku</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-bold">
            <span>Razem</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          <Link href="/koszyk/checkout" className="mt-5 block">
            <Button className="w-full" size="lg">
              Przejdź do zamówienia
            </Button>
          </Link>
          <Link
            href="/edytor"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Dodaj kolejny projekt
          </Link>
        </aside>
      </div>
    </section>
  );
}
