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
    <section className="bg-muted/60 border-b border-border">
      <div className="container mx-auto px-5 py-8 sm:px-6 lg:px-10 xl:px-12">
        <p className="mb-4 text-center text-base font-medium text-muted-foreground sm:text-lg">
          Wpisz coś, czego nie odważysz się powiedzieć głośno?
        </p>
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Wyszukaj kubek..."
              className="h-12 w-full rounded-full border-2 border-teal-400/60 bg-background pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-teal-500/50"
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-full bg-teal-500 px-6 text-sm font-semibold text-white transition hover:bg-teal-600 active:scale-95"
          >
            Szukaj
          </button>
        </form>
      </div>
    </section>
  );
}
