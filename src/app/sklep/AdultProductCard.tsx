"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { AgeGateModal, AGE_EVENT, confirmAge, isAgeConfirmed } from "./AgeGateModal";

/**
 * Owija kartę produktu dla dorosłych. Dopóki w tej sesji nie potwierdzono 18+,
 * zamiast karty pokazuje neutralny, zablokowany kafelek (bez zdjęcia/tytułu).
 * Kliknięcie otwiera klauzulę 18+; po akceptacji odblokowują się wszystkie
 * kafelki naraz (event AGE_EVENT). Niepełnoletni nie zobaczy treści.
 */
export function AdultProductCard({ children }: { children: React.ReactNode }) {
  const [confirmed, setConfirmed] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    setConfirmed(isAgeConfirmed());
    const onConfirmed = () => setConfirmed(true);
    window.addEventListener(AGE_EVENT, onConfirmed);
    return () => window.removeEventListener(AGE_EVENT, onConfirmed);
  }, []);

  if (confirmed) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:border-amber-500 hover:shadow-md"
      >
        <div className="relative grid aspect-square place-items-center bg-muted">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
              <Lock className="h-7 w-7 text-amber-500" />
            </div>
            <span className="text-2xl font-extrabold text-amber-500">18+</span>
          </div>
        </div>
        <div className="p-4">
          <p className="font-semibold">Treści dla dorosłych</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kliknij i potwierdź wiek, aby zobaczyć ten produkt.
          </p>
        </div>
      </button>

      {showModal && (
        <AgeGateModal
          onAccept={() => {
            confirmAge();
            setShowModal(false);
          }}
          onDecline={() => setShowModal(false)}
        />
      )}
    </>
  );
}
