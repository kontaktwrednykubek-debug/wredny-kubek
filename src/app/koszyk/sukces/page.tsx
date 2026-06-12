"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfettiLottie } from "@/components/ConfettiLottie";

export default function SukcesPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <SukcesContent />
    </React.Suspense>
  );
}

function SukcesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const orderId = params.get("orderId");

  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");

  React.useEffect(() => {
    if (!sessionId || !orderId) {
      router.replace("/sklep");
      return;
    }

    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, orderId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.paid || data.alreadyUpdated) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId, orderId, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Potwierdzamy Twoją płatność…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-destructive">Coś poszło nie tak.</p>
        <p className="text-muted-foreground">
          Jeśli płatność przeszła — sprawdź email lub skontaktuj się z nami.
        </p>
        <Link href="/sklep">
          <Button variant="outline">Wróć do sklepu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <ConfettiLottie />
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Zamówienie przyjęte!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Dziękujemy za zakup. Potwierdzenie wysłaliśmy na Twój email.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/account/zamowienia">
          <Button>Moje zamówienia</Button>
        </Link>
        <Link href="/sklep">
          <Button variant="outline">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Wróć do sklepu
          </Button>
        </Link>
      </div>
    </div>
  );
}
