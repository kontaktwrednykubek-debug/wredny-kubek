import type { Metadata } from "next";
import { MapPin, Phone, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Kontakt — Wredny Kubek",
  description: "Skontaktuj się z nami. Dane kontaktowe i lokalizacja Wrednego Kubka.",
};

export default function KontaktPage() {
  return (
    <main className="min-h-[80vh] bg-background">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-10">
        {/* Nagłówek */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Kontakt
          </h1>
          <p className="mt-3 text-muted-foreground">
            Masz pytanie? Pisz śmiało — odpiszemy jak tylko wypijemy kawę.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Dane kontaktowe */}
          <div className="space-y-6">
            {/* Adres */}
            <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Adres</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Wredny Kubek — Milena Bujniak<br />
                  Świdnik 25<br />
                  58-410 Marciszów
                </p>
              </div>
            </div>

            {/* Telefon */}
            <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Telefon</p>
                <a
                  href="tel:+48789111041"
                  className="mt-1 block text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  +48 789 111 041
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">E-mail</p>
                <a
                  href="mailto:czegoznowu@wrednykubek.pl"
                  className="mt-1 block text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  czegoznowu@wrednykubek.pl
                </a>
              </div>
            </div>

            {/* Godziny */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="font-semibold">Czas odpowiedzi</p>
              <p className="mt-1 text-sm text-muted-foreground italic">
                Odpowiadamy tak szybko, jak wypijemy kawę. Zazwyczaj trwa to chwilę.
              </p>
            </div>
          </div>

          {/* Mapa Google */}
          <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
            <iframe
              title="Lokalizacja Wredny Kubek"
              src="https://maps.google.com/maps?q=Świdnik+25,+58-410+Marciszów,+Polska&output=embed&z=15&hl=pl"
              width="100%"
              height="100%"
              style={{ minHeight: "420px", border: 0, display: "block" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
