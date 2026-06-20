"use client";

import * as React from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { AgeGateModal, AGE_EVENT, confirmAge, isAgeConfirmed } from "./AgeGateModal";

/**
 * Owija kartę produktu dla dorosłych. Dopóki w tej sesji nie potwierdzono 18+,
 * pokazuje ROZMAZANE zdjęcie produktu z nakładką i znakiem 18+ (coś widać, ale
 * treść jest zasłonięta). Kliknięcie otwiera klauzulę 18+; po akceptacji
 * odblokowują się wszystkie kafelki naraz (event AGE_EVENT).
 */
export function AdultProductCard({
  cover,
  children,
}: {
  cover?: string | null;
  children: React.ReactNode;
}) {
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
        <div className="relative aspect-square overflow-hidden bg-muted">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              unoptimized
              aria-hidden
              className="scale-110 object-cover blur-[4px]"
            />
          ) : null}
          {/* Nakładka przyciemniająca + znak 18+ */}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <Lock className="h-7 w-7" />
            </div>
            <span className="text-2xl font-extrabold drop-shadow">18+</span>
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
