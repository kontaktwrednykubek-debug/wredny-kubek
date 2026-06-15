"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, ShoppingBag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfettiLottie } from "@/components/ConfettiLottie";
import { useCart } from "@/features/cart/useCart";

export default function SukcesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <SukcesContent />
    </React.Suspense>
  );
}

const MAX_ATTEMPTS = 6;
const RETRY_DELAYS = [1000, 2000, 3000, 4000, 5000, 6000]; // 1s, 2s, 3s...

async function verifyWithRetry(
  sessionId: string,
  orderId: string,
  onAttempt?: (attempt: number) => void,
): Promise<{ paid: boolean; alreadyUpdated?: boolean; timedOut?: boolean }> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
    }

    onAttempt?.(attempt + 1);

    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, orderId }),
      });

      if (!res.ok) {
        // błąd serwera — nie próbuj dalej
        return { paid: false };
      }

      const data = await res.json();

      if (data.paid || data.alreadyUpdated) {
        return { paid: true };
      }

      // payment_status jeszcze nie "paid" po stronie Stripe — retry
      if (attempt < MAX_ATTEMPTS - 1) continue;
    } catch {
      if (attempt < MAX_ATTEMPTS - 1) continue;
    }
  }

  // Wszystkie próby nieudane — może webhook zadziała z opóźnieniem
  return { paid: false, timedOut: true };
}

function SukcesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const orderId = params.get("orderId");

  const [status, setStatus] = React.useState<
    "loading" | "success" | "timeout" | "error"
  >("loading");
  const [attempt, setAttempt] = React.useState(1);

  React.useEffect(() => {
    if (!sessionId || !orderId) {
      router.replace("/sklep");
      return;
    }

    verifyWithRetry(sessionId, orderId, setAttempt).then((result) => {
      if (result.paid) {
        // Płatność potwierdzona — dopiero teraz czyścimy koszyk
        useCart.getState().clear();
        setStatus("success");
      } else if (result.timedOut) {
        // Płatność prawdopodobnie przeszła (webhook dokończy) — też czyścimy
        useCart.getState().clear();
        // Stripe może potwierdzić przez webhook za chwilę — pokaż
        // przyjazny komunikat zamiast "błąd"
        setStatus("timeout");
      } else {
        setStatus("error");
      }
    });
  }, [sessionId, orderId, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-semibold">Potwierdzamy Twoją płatność…</p>
        <p className="text-sm text-muted-foreground">
          Próba {attempt} z {MAX_ATTEMPTS} — to może zająć kilka sekund
        </p>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Płatność w trakcie przetwarzania
          </h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Twoje zamówienie zostało złożone. Jeśli płatność przeszła — otrzymasz
            email z potwierdzeniem w ciągu kilku minut.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nie płać ponownie — sprawdź najpierw skrzynkę email.
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

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-destructive">
          Nie udało się potwierdzić płatności.
        </p>
        <p className="text-muted-foreground">
          Jeśli płatność przeszła — sprawdź email lub skontaktuj się z nami.
          Twoje zamówienie jest zapisane.
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
