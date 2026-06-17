"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Bramka wieku 18+. Pokazuje pełnoekranową klauzulę przy wejściu do kategorii
 * oznaczonej jako "dla dorosłych". Akceptacja zapamiętywana na czas sesji
 * przeglądarki (sessionStorage), żeby nie pytać przy każdym przejściu.
 */
export function AgeGate({ categorySlug }: { categorySlug: string }) {
  const router = useRouter();
  const storageKey = "age-gate-18plus-accepted";
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const accepted = sessionStorage.getItem(storageKey) === "1";
    if (!accepted) setOpen(true);
  }, [categorySlug]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  const accept = () => {
    sessionStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  const decline = () => {
    // Wyprowadź klienta poza kategorię 18+
    router.push("/sklep");
  };

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
          <Button onClick={accept} size="lg" className="w-full">
            Mam ukończone 18 lat — wchodzę
          </Button>
          <Button onClick={decline} size="lg" variant="outline" className="w-full">
            Nie mam 18 lat / wyjdź
          </Button>
        </div>
      </div>
    </div>
  );
}
