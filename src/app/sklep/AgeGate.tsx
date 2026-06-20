"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AgeGateModal, AGE_KEY, confirmAge } from "./AgeGateModal";

/**
 * Bramka wieku 18+ dla stron kategorii/produktu dla dorosłych. Otwiera
 * pełnoekranową klauzulę, gdy w tej sesji nie potwierdzono wieku. Akceptacja
 * (sessionStorage + event) odblokowuje wszystkie treści 18+ raz na sesję.
 */
export function AgeGate({ categorySlug }: { categorySlug: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (sessionStorage.getItem(AGE_KEY) !== "1") setOpen(true);
  }, [categorySlug]);

  if (!open) return null;

  return (
    <AgeGateModal
      onAccept={() => {
        confirmAge();
        setOpen(false);
      }}
      onDecline={() => router.push("/sklep")}
    />
  );
}
