"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus, ShoppingBag, AlertTriangle, Gift, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, cartTotalGr, cartGratisDiscountGr, useAutoClearCart, MYSTERY_MUG_ID, type CartItem } from "@/features/cart/useCart";
import { usePromoStore } from "@/features/promo/usePromoStore";
import { formatPrice } from "@/lib/utils";
import * as React from "react";

type MysteryMugConfig = {
  enabled: boolean;
  price_grosze: number;
  label: string;
  description: string;
  image_url: string | null;
};

export function CartClient() {
  const { items, setQuantity, remove, clear } = useCart();
  const add = useCart((s) => s.add);
  useAutoClearCart();

  // Promo jest ładowane globalnie przez PromoProvider w layout.tsx
  const promo = usePromoStore((s) => s.promo);

  // Upsell "Kubek w ciemno" — konfiguracja z panelu admina
  const [mysteryMug, setMysteryMug] = React.useState<MysteryMugConfig | null>(null);
  React.useEffect(() => {
    fetch("/api/mystery-mug", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMysteryMug(d.config ?? null))
      .catch(() => setMysteryMug(null));
  }, []);

  const mysteryInCart = items.find((i) => i.productId === MYSTERY_MUG_ID);

  const toggleMysteryMug = (checked: boolean) => {
    if (!mysteryMug) return;
    if (checked) {
      add({
        designId: null,
        productId: MYSTERY_MUG_ID,
        unitPriceGr: mysteryMug.price_grosze,
        previewUrl: mysteryMug.image_url ?? undefined,
        label: mysteryMug.label,
        quantity: 1,
      });
    } else if (mysteryInCart) {
      remove(mysteryInCart.id);
    }
  };

  // Fetch real-time stock from database
  const [stockMap, setStockMap] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    async function fetchStock() {
      const shopItems = items.filter(
        (item) => item.productId.startsWith("shop:") && item.variant?.color,
      );
      if (shopItems.length === 0) {
        setStockMap({});
        return;
      }
      try {
        const stockItems = shopItems.map((item) => ({
          slug: item.productId.slice("shop:".length),
          variantId: item.variant!.color!,
        }));
        const res = await fetch("/api/shop-products/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: stockItems }),
        });
        if (res.ok) {
          const data = await res.json();
          setStockMap(data.stock || {});
        }
      } catch (err) {
        console.error("[CartClient] Failed to fetch stock:", err);
      }
    }
    fetchStock();
  }, [items]);

  const itemsWithoutVariant = items.filter(
    (item) => item.productId.startsWith("shop:") && !item.variant?.color,
  );

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
  const gratisDiscount = cartGratisDiscountGr(items);

  const getMaxQty = (item: CartItem) => {
    if (!item.productId.startsWith("shop:") || !item.variant?.color) return 999;
    const slug = item.productId.slice("shop:".length);
    const key = `${slug}:${item.variant.color}`;
    return stockMap[key] ?? 999;
  };

  // JEDEN łączny progress bar dla całego koszyka
  const promoProgress = React.useMemo(() => {
    if (!promo?.active) return null;

    const totalQty = items
      .filter((i) => !i.isGratis)
      .reduce((s, i) => s + i.quantity, 0);

    const completedSets = Math.floor(totalQty / promo.buy_qty);
    const nextThreshold = (completedSets + 1) * promo.buy_qty;
    const inCurrentSet = totalQty - completedSets * promo.buy_qty;
    const needed = nextThreshold - totalQty;
    const progressPct = Math.round((inCurrentSet / promo.buy_qty) * 100);

    // Pokaż tylko gdy brakuje produktów do kolejnego progu (nie gdy już osiągnięty)
    if (needed <= 0 || needed >= promo.buy_qty) return null;

    return { totalQty, needed, nextThreshold, progressPct, completedSets };
  }, [items, promo]);

  return (
    <section className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Twój koszyk</h1>

      {/* Warning for items without variants */}
      {itemsWithoutVariant.length > 0 && (
        <div className="mb-6 rounded-2xl border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">
                Niektóre produkty wymagają wyboru wariantu koloru
              </p>
              <p className="mt-1 text-sm text-destructive/80">
                {itemsWithoutVariant.length}{" "}
                {itemsWithoutVariant.length === 1 ? "produkt" : "produkty"} w
                koszyku nie ma wybranego koloru. Usuń je i dodaj ponownie z
                wybranym wariantem.
              </p>
              <button
                onClick={() => itemsWithoutVariant.forEach((item) => remove(item.id))}
                className="mt-2 text-sm font-semibold text-destructive hover:underline"
              >
                Usuń te produkty ({itemsWithoutVariant.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {/* Baner aktywnej promocji */}
          {promo?.active && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
              <Gift className="h-4 w-4 shrink-0" />
              <span>{promo.label}</span>
            </div>
          )}

          {/* JEDEN łączny progress bar */}
          {promoProgress && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between text-sm font-medium text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-2">
                  <Gift className="h-4 w-4 shrink-0" />
                  Dobierz jeszcze{" "}
                  <strong>{promoProgress.needed} szt.</strong>
                  {" "}i dostaniesz{" "}
                  <strong>
                    {promoProgress.completedSets === 0
                      ? promo!.get_qty === 1 ? "1 kubek" : `${promo!.get_qty} kubki`
                      : promo!.get_qty === 1 ? `${promoProgress.completedSets + 1}. kubek` : `kolejne ${promo!.get_qty} kubki`}{" "}
                    gratis!
                  </strong>
                </span>
                <Link href="/sklep" className="flex shrink-0 items-center gap-1 text-xs hover:underline">
                  Do sklepu <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-900">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${promoProgress.progressPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-emerald-600/70 dark:text-emerald-400/70">
                {promoProgress.totalQty} / {promoProgress.nextThreshold} szt.
              </p>
            </div>
          )}

          {items.map((item) => {
            const isGratis = !!item.isGratis;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 ${
                  isGratis
                    ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-border bg-card"
                }`}
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.previewUrl ? (
                    <Image
                      src={item.previewUrl}
                      alt={item.label}
                      fill
                      className={`object-cover ${isGratis ? "opacity-80" : ""}`}
                      unoptimized
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                      brak
                    </div>
                  )}
                  {isGratis && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                        GRATIS
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.label}</p>
                    {isGratis && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">
                        <Gift className="h-3 w-3" />
                        +{item.quantity} gratis!
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isGratis ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Bezpłatnie (promocja)
                      </span>
                    ) : (
                      `${formatPrice(item.unitPriceGr)} / szt.`
                    )}
                  </p>

                  {!isGratis && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
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
                        disabled={
                          getMaxQty(item) !== undefined &&
                          item.quantity >= getMaxQty(item)
                        }
                        aria-label="Więcej"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {item.productId.startsWith("shop:") && item.variant?.color && (
                        <span className="text-xs text-muted-foreground">
                          max {getMaxQty(item)} szt.
                        </span>
                      )}
                    </div>
                  )}

                  {isGratis && (
                    <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70">
                      Dodane automatycznie · ilość zależy od zamówionych sztuk
                    </p>
                  )}
                </div>

                <div className="text-right">
                  {isGratis ? (
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      0,00 zł
                    </p>
                  ) : (
                    <p className="font-bold">
                      {formatPrice(item.unitPriceGr * item.quantity)}
                    </p>
                  )}
                  {!isGratis && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(item.id)}
                      aria-label="Usuń"
                      className="mt-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* UPSELL — Kubek w ciemno (losowy wzór) */}
          {mysteryMug?.enabled && (
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition ${
                mysteryInCart
                  ? "border-primary bg-primary/5"
                  : "border-primary/40 bg-primary/[0.03] hover:border-primary/70"
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(mysteryInCart)}
                onChange={(e) => toggleMysteryMug(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-primary"
              />
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {mysteryMug.image_url ? (
                  <Image src={mysteryMug.image_url} alt={mysteryMug.label} fill className="object-cover" unoptimized />
                ) : (
                  <div className="grid h-full place-items-center text-2xl">🎁</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  <Gift className="h-4 w-4 text-primary" />
                  {mysteryMug.label}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{mysteryMug.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-primary">{formatPrice(mysteryMug.price_grosze)}</p>
                <p className="text-xs text-muted-foreground">
                  {mysteryInCart ? "dodano ✓" : "dokup"}
                </p>
              </div>
            </label>
          )}

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
            <span>Produkty ({items.filter((i) => !i.isGratis).reduce((s, i) => s + i.quantity, 0)} szt.)</span>
            <span>{formatPrice(total)}</span>
          </div>
          {gratisDiscount > 0 && (
            <div className="mt-1 flex justify-between text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <Gift className="h-3.5 w-3.5" />
                Rabat promocyjny
              </span>
              <span>-{formatPrice(gratisDiscount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between text-sm">
            <span>Dostawa</span>
            <span className="text-muted-foreground">na następnym kroku</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-bold">
            <span>Razem</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          {gratisDiscount > 0 && (
            <p className="mt-2 rounded-xl bg-emerald-50 py-2 text-center text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              🎉 Oszczędzasz {formatPrice(gratisDiscount)}!
            </p>
          )}
          <Link href="/koszyk/checkout" className="mt-5 block">
            <Button
              className="w-full"
              size="lg"
              disabled={itemsWithoutVariant.length > 0}
            >
              {itemsWithoutVariant.length > 0
                ? "Usuń produkty bez wariantu"
                : "Przejdź do zamówienia"}
            </Button>
          </Link>
          <Link
            href="/edytor"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Dodaj kolejny produkt
          </Link>
        </aside>
      </div>
    </section>
  );
}
