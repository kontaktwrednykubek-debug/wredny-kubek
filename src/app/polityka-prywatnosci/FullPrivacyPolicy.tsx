"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function FullPrivacyPolicy() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        {open ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Ukryj pełną wersję
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Pokaż pełną (nudną) wersję
          </>
        )}
      </button>

      {open && (
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              1. Informacje ogólne
            </h3>
            <p>
              Niniejsza polityka dotyczy Serwisu www, funkcjonującego pod
              adresem url:{" "}
              <strong className="text-foreground">wrednykubek.pl</strong>
            </p>
            <p className="mt-1">
              Operatorem serwisu oraz Administratorem danych osobowych jest:{" "}
              <strong className="text-foreground">
                Milena Bujniak, prowadząca działalność pod firmą Wredny Kubek —
                Milena Bujniak, Świdnik 25, 58-410 Marciszów, NIP: 6141615267
              </strong>
            </p>
            <p className="mt-1">
              Adres kontaktowy poczty elektronicznej operatora:{" "}
              <a
                href="mailto:czegoznowu@wrednykubek.pl"
                className="text-primary underline underline-offset-4"
              >
                czegoznowu@wrednykubek.pl
              </a>
            </p>
            <p className="mt-2">
              Operator jest Administratorem Twoich danych osobowych w
              odniesieniu do danych podanych dobrowolnie w Serwisie.
            </p>
            <p className="mt-2">
              Serwis wykorzystuje dane osobowe w następujących celach:
              realizacja zamówień, obsługa płatności, prowadzenie newslettera,
              prowadzenie systemu komentarzy i opinii.
            </p>
            <p className="mt-2">
              Serwis realizuje funkcje pozyskiwania informacji o użytkownikach i
              ich zachowaniu poprzez dobrowolnie wprowadzone w formularzach dane
              oraz poprzez zapisywanie w urządzeniach końcowych plików cookie.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              2. Odbiorcy danych osobowych
            </h3>
            <p>
              W celu realizacji usług, dane osobowe mogą być przekazywane
              zaufanym partnerom:
            </p>
            <ul className="mt-1 list-disc pl-5 space-y-0.5">
              <li>
                <strong>Vercel.com</strong> – firma hostingowa, na której
                serwerach działa Serwis.
              </li>
              <li>
                <strong>InPost Sp. z o.o.</strong> – realizacja dostaw zamówień.
              </li>
              <li>
                <strong>Stripe (Stripe Payments Europe, Ltd.)</strong> – obsługa
                płatności kartą i BLIKiem.
              </li>
              <li>
                <strong>Przelewy24 (PayPro S.A.)</strong> – alternatywny
                operator płatności.
              </li>
            </ul>
            <p className="mt-2">
              Partnerzy płatnościowi przetwarzają dane płatności (numer karty,
              dane BLIK) bezpośrednio we własnych systemach. Operator nie
              przechowuje pełnych danych kart płatniczych.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              3. Metody ochrony danych
            </h3>
            <p>
              Miejsca logowania i wprowadzania danych osobowych są chronione w
              warstwie transmisji (certyfikat SSL). Hasła użytkowników są
              przechowywane w postaci hashowanej. Operator regularnie
              aktualizuje oprogramowanie wykorzystywane do przetwarzania danych
              osobowych.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              4. Hosting
            </h3>
            <p>
              Serwis jest hostowany na serwerze operatora:{" "}
              <strong className="text-foreground">Vercel.com</strong>. Firma
              hostingowa prowadzi logi na poziomie serwera, w tym: adresy URL
              żądanych zasobów, czas nadejścia i wysłania odpowiedzi, adres IP,
              informacje o przeglądarce użytkownika oraz informacje
              diagnostyczne.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              5. Twoje prawa i dodatkowe informacje
            </h3>
            <p>
              Twoje dane osobowe przetwarzane są przez Administratora nie
              dłużej, niż jest to konieczne do wykonania związanych z nimi
              czynności. W odniesieniu do danych marketingowych dane nie będą
              przetwarzane dłużej niż przez 3 lata.
            </p>
            <p className="mt-2">
              Przysługuje Ci prawo żądania od Administratora:
            </p>
            <ul className="mt-1 list-disc pl-5 space-y-0.5">
              <li>dostępu do danych osobowych Ciebie dotyczących,</li>
              <li>ich sprostowania,</li>
              <li>usunięcia,</li>
              <li>ograniczenia przetwarzania,</li>
              <li>przenoszenia danych.</li>
            </ul>
            <p className="mt-2">
              Na działania Administratora przysługuje skarga do Prezesa Urzędu
              Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa. Podanie
              danych osobowych jest dobrowolne, lecz niezbędne do obsługi
              Serwisu (w szczególności do realizacji zamówień i płatności).
            </p>
            <p className="mt-2">
              Dane osobowe mogą być przekazywane do krajów trzecich w rozumieniu
              przepisów o ochronie danych osobowych (poza teren Unii
              Europejskiej), w szczególności w związku z wykorzystaniem usług
              Stripe oraz infrastruktury Vercel.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              6. Informacje w formularzach
            </h3>
            <p>
              Serwis zbiera informacje podane dobrowolnie przez użytkownika.
              Serwis może zapisać informacje o parametrach połączenia
              (oznaczenie czasu, adres IP). Dane podane w formularzu są
              przetwarzane w celu wynikającym z funkcji konkretnego formularza
              (np. składanie zamówienia, kontakt).
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              7. Logi Administratora
            </h3>
            <p>
              Informacje o zachowaniu użytkowników w serwisie mogą podlegać
              logowaniu. Dane te są wykorzystywane w celu administrowania
              serwisem oraz rozwiązywania problemów technicznych.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              8. Informacja o plikach cookies
            </h3>
            <p>
              Serwis korzysta z plików cookies. Pliki cookies stanowią dane
              informatyczne przechowywane w urządzeniu końcowym Użytkownika.
              Stosowane są dwa rodzaje:{" "}
              <strong className="text-foreground">sesyjne</strong> (usuwane po
              zamknięciu przeglądarki) oraz{" "}
              <strong className="text-foreground">stałe</strong> (przechowywane
              przez czas określony w parametrach lub do usunięcia przez
              Użytkownika).
            </p>
            <p className="mt-2">
              Pliki cookies mogą być zamieszczane przez współpracujące podmioty,
              w szczególności: Google LLC (USA), Meta Platforms, Inc. (Facebook,
              USA).
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              9. Zarządzanie plikami cookies
            </h3>
            <p>
              Użytkownik może zmienić ustawienia przeglądarki dotyczące plików
              cookies. Wyłączenie obsługi plików cookies niezbędnych dla
              procesów uwierzytelniania może utrudnić korzystanie ze stron www.
              Zarządzanie cookies możliwe jest w ustawieniach przeglądarek:
              Edge, Chrome, Safari, Firefox, Opera oraz urządzeń mobilnych
              (Android, iOS, Windows Phone).
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
