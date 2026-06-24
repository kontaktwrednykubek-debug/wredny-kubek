"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export type Category = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

export function ShopFilters({
  categories,
  globalMinGr,
  globalMaxGr,
  selectedCategory,
  selectedMinGr,
  selectedMaxGr,
}: {
  categories: Category[];
  globalMinGr: number;
  globalMaxGr: number;
  selectedCategory: string | null;
  selectedMinGr: number;
  selectedMaxGr: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [minGr, setMinGr] = React.useState(selectedMinGr);
  const [maxGr, setMaxGr] = React.useState(selectedMaxGr);
  const [openMobile, setOpenMobile] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setMinGr(selectedMinGr);
    setMaxGr(selectedMaxGr);
  }, [selectedMinGr, selectedMaxGr]);

  const parents = categories.filter((c) => c.parent_id === null);

  // Czyste adresy: kategoria w ścieżce (/sklep/kategoria/<slug>),
  // a filtry ceny/wyszukiwania jako parametry zapytania.
  const basePath = selectedCategory
    ? `/sklep/kategoria/${selectedCategory}`
    : "/sklep";

  // Buduje URL z aktualną kategorią (ścieżka) i podanymi parametrami zapytania.
  function buildHref(updates: Record<string, string | null>): string {
    const next = new URLSearchParams(params.toString());
    next.delete("category"); // kategoria nie jest już parametrem zapytania
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function setCategory(slug: string | null) {
    // Zmiana kategorii zmienia ścieżkę; zachowujemy filtry ceny/wyszukiwania.
    const next = new URLSearchParams(params.toString());
    next.delete("category");
    const qs = next.toString();
    const target = slug ? `/sklep/kategoria/${slug}` : "/sklep";
    router.push(qs ? `${target}?${qs}` : target);
    setOpenMobile(false);
  }

  function applyPrice() {
    router.push(
      buildHref({
        minPrice: String(minGr),
        maxPrice: String(maxGr),
      }),
    );
    setOpenMobile(false);
  }

  function clearAll() {
    router.push("/sklep");
    setOpenMobile(false);
  }

  const hasFilters =
    selectedCategory !== null ||
    selectedMinGr > globalMinGr ||
    selectedMaxGr < globalMaxGr;

  const inner = (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Kategorie
          </h3>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Wyczyść
            </button>
          )}
        </div>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => setCategory(null)}
              className={`w-full rounded-lg px-2 py-1.5 text-left transition ${
                selectedCategory === null
                  ? "bg-primary/10 font-semibold text-primary"
                  : "hover:bg-muted"
              }`}
            >
              Wszystkie
            </button>
          </li>
          {parents.map((parent) => {
            const children = categories.filter(
              (c) => c.parent_id === parent.id,
            );
            const isExpanded = expanded[parent.id] ?? false;
            const isSelected = selectedCategory === parent.slug;
            return (
              <li key={parent.id}>
                <div className="flex items-center">
                  <button
                    onClick={() => setCategory(parent.slug)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-left transition ${
                      isSelected
                        ? "bg-primary/10 font-semibold text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {parent.name}
                  </button>
                  {children.length > 0 && (
                    <button
                      onClick={() =>
                        setExpanded((e) => ({
                          ...e,
                          [parent.id]: !isExpanded,
                        }))
                      }
                      className="rounded-lg p-1 hover:bg-muted"
                      aria-label={
                        isExpanded ? "Zwiń podkategorie" : "Rozwiń podkategorie"
                      }
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
                {isExpanded && children.length > 0 && (
                  <ul className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                    {children.map((child) => (
                      <li key={child.id}>
                        <button
                          onClick={() => setCategory(child.slug)}
                          className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition ${
                            selectedCategory === child.slug
                              ? "bg-primary/10 font-semibold text-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          {child.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Cena
        </h3>
        <div className="space-y-4">
          {/* Etykiety min/max po bokach */}
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-primary">{formatPrice(minGr)}</span>
            <span className="text-primary">{formatPrice(maxGr)}</span>
          </div>

          {/* Dual-range: dwa inputy nałożone na siebie */}
          <DualRange
            min={globalMinGr}
            max={globalMaxGr}
            step={100}
            valueMin={minGr}
            valueMax={maxGr}
            onChangeMin={(v: number) => setMinGr(v)}
            onChangeMax={(v: number) => setMaxGr(v)}
          />

          <button
            onClick={applyPrice}
            className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Zastosuj
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpenMobile(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm lg:hidden"
      >
        <Filter className="h-4 w-4" />
        Filtry
        {hasFilters && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            aktywne
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
          {inner}
        </div>
      </aside>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filtry</h2>
              <button
                onClick={() => setOpenMobile(false)}
                className="rounded-lg p-1 hover:bg-muted"
                aria-label="Zamknij"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {inner}
          </div>
        </div>
      )}
    </>
  );
}

function DualRange({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}) {
  const range = max - min || 1;
  const leftPct = ((valueMin - min) / range) * 100;
  const rightPct = ((valueMax - min) / range) * 100;

  const thumbCls =
    "pointer-events-none absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full " +
    "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary " +
    "[&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-md " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 " +
    "[&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:appearance-none";

  return (
    <div className="relative h-6 w-full">
      {/* Szara szyna */}
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
      {/* Kolorowy zakres między uchwytami */}
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
        style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
      />
      {/* Lewy uchwyt (min) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          onChangeMin(Math.min(v, valueMax - step));
        }}
        className={thumbCls}
      />
      {/* Prawy uchwyt (max) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          onChangeMax(Math.max(v, valueMin + step));
        }}
        className={thumbCls}
      />
    </div>
  );
}
