"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary dla całej sekcji /koszyk (koszyk + checkout).
 * Najczęstsza przyczyna błędu to uszkodzona pozycja w localStorage,
 * dlatego dajemy użytkownikowi przycisk do wyczyszczenia koszyka
 * zamiast martwej białej strony "Application error".
 */
export default function CartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[koszyk] render error:", error);
  }, [error]);

  const clearCartAndReset = () => {
    try {
      localStorage.removeItem("kubkomania-cart");
    } catch {
      /* ignore */
    }
    reset();
  };

  return (
    <section className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
      <h1 className="mt-4 text-3xl font-bold">Coś poszło nie tak z koszykiem</h1>
      <p className="mt-3 text-muted-foreground">
        Najczęściej pomaga wyczyszczenie koszyka. Twoje produkty możesz dodać
        ponownie z poziomu sklepu.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={clearCartAndReset}>
          Wyczyść koszyk i spróbuj ponownie
        </Button>
        <Link href="/sklep">
          <Button size="lg" variant="outline">
            Wróć do sklepu
          </Button>
        </Link>
      </div>
    </section>
  );
}
