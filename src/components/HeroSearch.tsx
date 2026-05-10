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
    <section className="w-full border-b border-border bg-background py-10 px-5 sm:px-8">
      <p className="mb-5 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground sm:text-base">
        Wpisz coś, czego nie odważysz się powiedzieć głośno?
      </p>
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-0 rounded-full border-2 border-teal-400/70 bg-background shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-teal-500/50">
        <Search className="ml-5 h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wyszukaj kubek..."
          className="h-14 flex-1 bg-transparent pl-4 pr-4 text-sm outline-none sm:text-base"
        />
        <button
          type="submit"
          className="m-1.5 h-11 shrink-0 rounded-full bg-teal-500 px-7 text-sm font-semibold text-white transition hover:bg-teal-600 active:scale-95 sm:h-12 sm:px-8 sm:text-base"
        >
          Szukaj
        </button>
      </form>
    </section>
  );
}
