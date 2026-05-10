import { Metadata } from "next";
import { FullPrivacyPolicy } from "./FullPrivacyPolicy";

export const metadata: Metadata = {
  title: "Polityka Prywatności",
  description:
    "Jak dbamy o Twoje dane na wrednykubek.pl – wersja z humorem i bez ściemy.",
};

export default function PolitykaPrywatnosci() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
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
            Administratorem Twoich danych jest <strong>Milena Bujniak</strong>{" "}
            (Świdnik 25, 58-410 Marciszów). Jeśli masz sprawę, pisz na:{" "}
            <a
              href="mailto:wrednykubek@gmail.com"
              className="text-primary underline underline-offset-4"
            >
              wrednykubek@gmail.com
            </a>
            .
          </p>
          <p className="mt-2">
            Twoje dane zbieramy tylko wtedy, gdy nam je dobrowolnie podasz (np.
            żebyśmy wiedzieli, gdzie wysłać Twój kubek z Avadą). Wykorzystujemy
            je do:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Wysyłania Ci newslettera (tylko z konkretami, zero spamu o
              niczym).
            </li>
            <li>
              Obsługi Twoich komentarzy (żebyś mógł wyrazić swoje zdanie).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            2. Twoje hasło jest bezpieczniejsze niż Ty w poniedziałek rano
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
            3. Hosting (Gdzie mieszkają Twoje dane?)
          </h2>
          <p>
            Nasza strona mieszka na serwerach{" "}
            <strong>Vercel.com</strong>. Jak każdy porządny gospodarz, serwer
            zapisuje logi (adres IP, czas zapytania, info o przeglądarce). Robi
            to po to, żeby strona działała szybko i bezawaryjnie, a nie żeby Cię
            śledzić, kiedy jesz płatki.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            4. Twoje prawa (Masz głos!)
          </h2>
          <p>Nie jesteśmy dyktaturą. Masz prawo do:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Wglądu w swoje dane (zobacz, co o Tobie wiemy).</li>
            <li>
              Poprawienia ich (jeśli np. zmieniłeś adres na taki, gdzie nie ma
              cyrku).
            </li>
            <li>
              Usunięcia ich (zapomnimy o Tobie szybciej niż o postanowieniach
              noworocznych).
            </li>
            <li>
              Złożenia skargi do Prezesa UODO (ale mamy nadzieję, że dogadamy
              się przy kawie).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            5. Ciasteczka (Cookies) – Te, których nie zjesz
          </h2>
          <p>
            Nasz serwis używa ciasteczek, żebyś nie musiał się logować co pięć
            sekund. Są dwa rodzaje:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <strong>Sesyjne:</strong> Znikają, gdy zamkniesz przeglądarkę.
            </li>
            <li>
              <strong>Stałe:</strong> Zostają na dłużej, żebyśmy Cię rozpoznali,
              jak wrócisz po kolejny kubek.
            </li>
          </ul>
          <p className="mt-2">
            Możesz je wyłączyć w ustawieniach przeglądarki, ale wtedy strona
            może działać… no, tak sobie. Twoje ciasteczka mogą też podglądać
            nasi kumple z Google czy Facebooka (żebyśmy wiedzieli, jakie kubki
            pokazać Ci w reklamach).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            6. Formularze (Dajesz nam info, my dajemy kubek)
          </h2>
          <p>
            Jeśli wypełniasz formularz, robisz to dobrowolnie. My te dane
            szanujemy i używamy ich tylko do tego, do czego służy dany formularz
            (np. do kontaktu z Tobą).
          </p>
        </section>
      </div>

      {/* Link do pełnej wersji */}
      <div className="mt-12 rounded-2xl border border-border bg-muted/40 p-5">
        <p className="text-sm text-muted-foreground">
          Jesteś ciekaw pełnej, mniej humorystycznej wersji?{" "}
          <span className="text-foreground font-medium">Kliknij poniżej</span>{" "}
          i przygotuj kawę — będzie trochę czytania.
        </p>
        <FullPrivacyPolicy />
      </div>
    </main>
  );
}
