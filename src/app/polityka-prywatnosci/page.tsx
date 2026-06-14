import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FullPrivacyPolicy } from "./FullPrivacyPolicy";

export const metadata: Metadata = {
  title: "Polityka Prywatności",
  description:
    "Jak dbamy o Twoje dane na wrednykubek.pl – wersja z humorem i bez ściemy.",
};

export default function PolitykaPrywatnosci() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć na stronę główną
      </Link>
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Polityka Prywatności
      </h1>
      <p className="mb-10 text-muted-foreground">
        Czyli jak dbamy o Twoje dane, żeby nie było cyrku.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed sm:text-base">
        <p>
          Słuchaj, nikt nie czyta polityki prywatności, ale skoro tu jesteś, to
          znaczy, że albo Ci się nudzi, albo naprawdę pilnujesz swoich spraw.
          Szanujemy to. Oto konkretne info o tym, co się dzieje z Twoimi danymi
          na wrednykubek.pl.
        </p>

        <section>
          <h2 className="text-xl font-bold mb-3">
            1. Kto tu rządzi? (Informacje ogólne)
          </h2>
          <p>
            Administratorem Twoich danych osobowych jest:{" "}
            <strong>Milena Bujniak</strong>, prowadząca działalność pod firmą{" "}
            <strong>Wredny Kubek — Milena Bujniak</strong>, Świdnik 25, 58-410
            Marciszów, NIP: <strong>6141615267</strong>.
          </p>
          <p className="mt-2">
            Jeśli masz sprawę, pisz na nasz oficjalny adres:{" "}
            <a
              href="mailto:czegoznowu@wrednykubek.pl"
              className="text-primary underline underline-offset-4"
            >
              czegoznowu@wrednykubek.pl
            </a>
            .
          </p>
          <p className="mt-2">
            Twoje dane zbieramy tylko wtedy, gdy nam je dobrowolnie podasz.
            Wykorzystujemy je do:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Realizacji Twojego zamówienia (wysyłka kubka).</li>
            <li>Obsługi płatności.</li>
            <li>
              Wysyłania Ci newslettera (tylko z konkretami, zero spamu o
              niczym).
            </li>
            <li>Obsługi Twoich komentarzy i opinii.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            2. Komu przekazujemy dane? (Bo sami kubków nie nosimy)
          </h2>
          <p>
            Żeby Twój kubek dojechał, a kasa się zgadzała, współpracujemy z
            zaufanymi partnerami:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <strong>Hosting:</strong> Vercel.com (tam mieszka nasza strona).
            </li>
            <li>
              <strong>Dostawa:</strong> InPost Sp. z o.o. (oni wsadzają paczkę
              do Paczkomatu).
            </li>
            <li>
              <strong>Płatności:</strong> Stripe (Stripe Payments Europe, Ltd.)
              oraz Przelewy24 (PayPro S.A.) – to im przekazujesz dane karty lub
              BLIKa, żeby bezpiecznie zapłacić.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            3. Twoje hasło jest bezpieczniejsze niż Ty w poniedziałek rano
          </h2>
          <p>
            Stosujemy certyfikat SSL, co oznacza, że Twoje dane są szyfrowane,
            zanim w ogóle opuszczą Twój komputer. Hasła przechowujemy w formie
            „hashowanej" – nawet my nie wiemy, jakie masz hasło. To współczesny
            standard, więc śpij spokojnie.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            4. Twoje prawa (Masz głos!)
          </h2>
          <p>
            Nie jesteśmy dyktaturą. W każdej chwili masz prawo do: wglądu w
            swoje dane, ich sprostowania, ograniczenia przetwarzania,
            przeniesienia oraz całkowitego usunięcia (zapomnimy o Tobie szybciej
            niż o postanowieniach noworocznych). Masz też prawo złożyć skargę do
            Prezesa UODO (ul. Stawki 2, 00-193 Warszawa), ale mamy nadzieję, że
            dogadamy się przy kawie.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            5. Ciasteczka (Cookies) – Te, których nie zjesz
          </h2>
          <p>
            Nasz serwis używa ciasteczek, żeby strona działała szybko i żebyś
            nie musiał wpisywać wszystkiego od nowa. Twoje ciasteczka mogą też
            podglądać nasi kumple z Google czy Meta/Facebooka (żebyśmy
            wiedzieli, jakie wredne kubki pokazać Ci w reklamach). Możesz je
            wyłączyć w ustawieniach przeglądarki, ale wtedy strona może działać…
            no, tak sobie.
          </p>
        </section>
      </div>

      {/* Link do pełnej wersji */}
      <div className="mt-12 rounded-2xl border border-border bg-muted/40 p-5">
        <p className="text-sm text-muted-foreground">
          Jesteś ciekaw pełnej, mniej humorystycznej wersji?{" "}
          <span className="text-foreground font-medium">Kliknij poniżej</span> i
          przygotuj kawę — będzie trochę czytania.
        </p>
        <FullPrivacyPolicy />
      </div>
    </main>
  );
}
