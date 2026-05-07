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

  function buildHref(updates: Record<string, string | null>): string {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/sklep?${qs}` : "/sklep";
  }

  function setCategory(slug: string | null) {
    router.push(buildHref({ category: slug }));
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
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{formatPrice(minGr)}</span>
            <span className="text-muted-foreground">—</span>
            <span className="font-semibold">{formatPrice(maxGr)}</span>
          </div>

          <div className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">
                Od (zł)
              </span>
              <input
                type="range"
                min={globalMinGr}
                max={globalMaxGr}
                step={100}
                value={minGr}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setMinGr(Math.min(v, maxGr - 100));
                }}
                className="w-full accent-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">
                Do (zł)
              </span>
              <input
                type="range"
                min={globalMinGr}
                max={globalMaxGr}
                step={100}
                value={maxGr}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setMaxGr(Math.max(v, minGr + 100));
                }}
                className="w-full accent-primary"
              />
            </label>
          </div>

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
