"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/sklep?q=${encodeURIComponent(q)}`);
  }

  return (
    <section className="w-full overflow-hidden border-b border-border bg-background px-4 py-8 sm:px-8 sm:py-10">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:mb-5 sm:text-sm">
        Wpisz coś, czego nie odważysz się powiedzieć głośno?
      </p>
      <form onSubmit={handleSubmit} className="flex w-full items-center rounded-full border-2 border-teal-400/70 bg-background shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-teal-500/50">
        <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground sm:ml-5 sm:h-5 sm:w-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wyszukaj kubek..."
          className="h-12 min-w-0 flex-1 bg-transparent pl-3 pr-2 text-sm outline-none sm:h-14 sm:pl-4 sm:text-base"
        />
        <button
          type="submit"
          className="m-1 h-10 shrink-0 rounded-full bg-teal-500 px-4 text-sm font-semibold text-white transition hover:bg-teal-600 active:scale-95 sm:m-1.5 sm:h-11 sm:px-7"
        >
          Szukaj
        </button>
      </form>
    </section>
  );
}
