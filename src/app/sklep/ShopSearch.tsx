"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/** Zdarzenie z lupy w górnym menu — rozwija i ustawia kursor w wyszukiwarce sklepu. */
export const SHOP_SEARCH_FOCUS_EVENT = "shop-search-focus";

/**
 * Wyszukiwarka sklepu (kopia HeroSearch ze strony głównej), przyklejona pod menu.
 * Mobile: zwinięta do paska z lupą, rozwija się po kliknięciu.
 * Szuka w bieżącej kategorii i zachowuje pozostałe filtry (cena).
 */
export function ShopSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("q") ?? "";
  const [query, setQuery] = React.useState(current);
  const [expanded, setExpanded] = React.useState(current !== "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setQuery(current), [current]);

  const focusInput = React.useCallback(() => {
    setExpanded(true);
    // Po rozwinięciu (mobile) input pojawia się w następnej klatce.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Lupa z menu: na stronie sklepu event, z innej strony przejście na /sklep#szukaj.
  React.useEffect(() => {
    if (window.location.hash === "#szukaj") focusInput();
    window.addEventListener(SHOP_SEARCH_FOCUS_EVENT, focusInput);
    return () => window.removeEventListener(SHOP_SEARCH_FOCUS_EVENT, focusInput);
  }, [focusInput]);

  function go(q: string) {
    const next = new URLSearchParams(params.toString());
    if (q) next.set("q", q);
    else next.delete("q");
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    go(query.trim());
    inputRef.current?.blur();
  }

  function clear() {
    setQuery("");
    if (current) go("");
    inputRef.current?.focus();
  }

  return (
    <div
      id="szukaj"
      className="sticky top-20 z-30 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-md sm:px-6 sm:py-3"
    >
      <div className="container mx-auto px-1 lg:px-4 xl:px-6">
        {/* Mobile, zwinięta: pasek z lupą */}
        {!expanded && (
          <button
            type="button"
            onClick={focusInput}
            className="flex h-11 w-full items-center gap-3 rounded-full border-2 border-teal-400/70 bg-background px-4 text-sm text-muted-foreground shadow-sm md:hidden dark:border-teal-500/50"
          >
            <Search className="h-4 w-4 shrink-0" />
            Wyszukaj kubek...
          </button>
        )}

        <form
          onSubmit={handleSubmit}
          role="search"
          className={`${expanded ? "flex" : "hidden md:flex"} w-full items-center rounded-full border-2 border-teal-400/70 bg-background shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-teal-500/50`}
        >
          <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground sm:ml-5 sm:h-5 sm:w-5" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => { if (!query && !current) setExpanded(false); }}
            placeholder="Wyszukaj kubek..."
            aria-label="Wyszukaj kubek"
            className="h-11 min-w-0 flex-1 bg-transparent pl-3 pr-2 text-sm outline-none sm:h-12 sm:pl-4 sm:text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
              aria-label="Wyczyść wyszukiwanie"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="m-1 h-9 shrink-0 rounded-full bg-teal-500 px-4 text-sm font-semibold text-white transition hover:bg-teal-600 active:scale-95 sm:h-10 sm:px-7"
          >
            Szukaj
          </button>
        </form>
      </div>
    </div>
  );
}
