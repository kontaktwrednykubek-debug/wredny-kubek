"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Wspólny klucz sesji i event — potwierdzenie 18+ raz na sesję odblokowuje
// WSZYSTKIE treści dla dorosłych (lista sklepu + strony produktów) natychmiast.
export const AGE_KEY = "age-gate-18plus-accepted";
export const AGE_EVENT = "age-18plus-confirmed";

export function isAgeConfirmed(): boolean {
  return typeof window !== "undefined" && sessionStorage.getItem(AGE_KEY) === "1";
}

export function confirmAge(): void {
  sessionStorage.setItem(AGE_KEY, "1");
  window.dispatchEvent(new Event(AGE_EVENT));
}

/** Pełnoekranowa klauzula 18+ (sama treść). Akcje steruje rodzic. */
export function AgeGateModal({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-extrabold">Treści dla dorosłych 18+</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Uwaga! Wchodzisz do sekcji przeznaczonej{" "}
          <strong>wyłącznie dla osób pełnoletnich</strong>. Znajdziesz tu
          produkty o charakterze wulgarnym i humorze dla dorosłych — mocne,
          dosadne słownictwo i treści, które mogą być uznane za nieodpowiednie
          lub obraźliwe.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Klikając „wchodzę" oświadczasz, że masz ukończone{" "}
          <strong>18 lat</strong> i przeglądasz te treści świadomie,
          dobrowolnie i <strong>na własną odpowiedzialność</strong>. Sklep nie
          ponosi odpowiedzialności za odbiór tych treści.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/80">
          Jeśli nie masz ukończonych 18 lat lub takie treści Ci nie odpowiadają
          — opuść tę sekcję.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={onAccept} size="lg" className="w-full">
            Mam ukończone 18 lat — wchodzę
          </Button>
          <Button onClick={onDecline} size="lg" variant="outline" className="w-full">
            Nie mam 18 lat / wyjdź
          </Button>
        </div>
      </div>
    </div>
  );
}
