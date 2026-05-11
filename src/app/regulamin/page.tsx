import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Regulamin sklepu – WrednyKubek.pl",
  description: "Regulamin sklepu WrednyKubek.pl",
};

export default function RegulaminsPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do strony głównej
      </Link>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="mb-1 text-3xl font-extrabold">☕ Regulamin Sklepu WrednyKubek.pl</h1>
        <p className="mt-0 text-sm text-muted-foreground italic">
          (Czyli co wolno Tobie, a czego nie wolno nam, choć byśmy chcieli)
        </p>

        <p className="mt-6">
          Witaj w miejscu, gdzie kawa smakuje lepiej, bo kubek ma charakter. Składając zamówienie,
          oświadczasz, że masz poczucie humoru i akceptujesz poniższe zasady. Jeśli ich nie
          czytasz – Twoja strata, i tak Cię wiążą.
        </p>

        <Section title="§1 KTO TU RZĄDZI? (DANE SPRZEDAWCY)">
          <p>Właścicielem zamieszania i osobą, która dopilnuje Twojego zamówienia, jest:</p>
          <p>
            <strong>Wredny Kubek — Milena Bujniak</strong><br />
            Świdnik 25, 58-410 Marciszów<br />
            NIP: (tu wpisz swój NIP) | REGON: (tu wpisz swój REGON)
          </p>
          <p>Kontakt (jeśli musisz):</p>
          <ul>
            <li>Mail: <a href="mailto:wrednykubek@gmail.com">wrednykubek@gmail.com</a></li>
            <li>Telefon: <a href="tel:+48789111041">+48 789 111 041</a></li>
          </ul>
          <p className="text-muted-foreground italic">
            Ważne: Odpowiadamy tak szybko, jak wypijemy kawę. Zazwyczaj trwa to chwilę.
          </p>
        </Section>

        <Section title="§2 JAK KUPIĆ I NIE ZWARIOWAĆ?">
          <ul>
            <li>
              <strong>Bez zbędnych formalności:</strong> Nie musisz zakładać konta, podawać imienia
              chomika ani przechodzić rekrutacji. Kupujesz jako gość.
            </li>
            <li>
              <strong>Proces:</strong> Wybierasz kubek, dodajesz do koszyka, płacisz i czekasz na
              kuriera.
            </li>
            <li>
              <strong>Czas oczekiwania:</strong> Nasze kubki to małe dzieła sztuki (nawet te
              najbardziej wredne). Czas realizacji trwa od 1 do 14 dni roboczych. Nie poganiaj nas
              – cierpliwość to cnota, a dobry kubek wymaga czasu.
            </li>
          </ul>
        </Section>

        <Section title="§3 KASA I PUDEŁKA (PŁATNOŚCI I DOSTAWA)">
          <ul>
            <li>
              <strong>Płatności:</strong> Akceptujemy to, co wygodne: Przelewy24, BLIK oraz
              przelew tradycyjny. Nie wysyłamy za pobraniem – ufamy sobie nawzajem, ale pieniądze
              wolimy widzieć wcześniej.
            </li>
            <li>
              <strong>Dostawa:</strong> Twoje zamówienie dowiezie InPost (Paczkomat lub Kurier).
            </li>
            <li>
              <strong>Koszty:</strong> System policzy je w koszyku. Ty płacisz, InPost wiezie.
            </li>
          </ul>
          <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm">
            <strong>Ważna Uwaga (tzw. „Karny Jeżyk"):</strong> Jeśli nie odbierzesz paczki z
            Paczkomatu, bo zapomniałeś/aś albo Ci się nie chciało, a paczka do nas wróci –
            zwrócimy Ci pieniądze, ale pomniejszone o koszt wysyłki w obie strony. Szanujmy swój
            czas i paliwo kuriera.
          </p>
        </Section>

        <Section title='§4 ZWROTY (CZYLI "JEDNAK GO NIE CHCĘ")'>
          <ul>
            <li>
              <strong>Standardowy zwrot:</strong> Masz 14 dni na zmianę zdania (liczone od dnia
              odebrania paczki).
            </li>
            <li>
              <strong>Warunek:</strong> Produkt musi być w stanie nienaruszonym (zero śladów kawy,
              herbaty czy rzucania o ścianę) i w oryginalnym opakowaniu. Odsyłasz na swój koszt.
            </li>
          </ul>
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium">
            <strong>WYJĄTEK (NAJWAŻNIEJSZE):</strong> Jeśli zamówisz kubek personalizowany (z
            Twoim imieniem, dedykacją, datą lub napisem, który wymyśliłeś po trzech głębszych) –
            nie ma zwrotów. Taki kubek jest tylko Twój. Nikt inny nie chce pić z kubka z napisem
            „Najlepszy kierowca z Marciszowa", jeśli nazywa się inaczej.
          </p>
        </Section>

        <Section title="§5 REKLAMACJE (GDY COŚ POSZŁO NIE TAK)">
          <ul>
            <li>
              <strong>Czas na zgłoszenie:</strong> Jeśli kubek przyszedł wadliwy lub pomyliliśmy
              napisy, masz 14 dni roboczych na cynk. Po tym czasie uznajemy, że wszystko jest super
              i reklamacji nie przyjmiemy.
            </li>
            <li>
              <strong>Bitwa z InPostem:</strong> Jeśli paczka wygląda, jakby przejechał po niej
              czołg – spisz protokół szkody przy kurierze lub przy Paczkomacie. Bez tego świstka
              InPost powie nam „nie", a my będziemy mieli związane ręce.
            </li>
            <li>
              <strong>Decyzja:</strong> Mamy 7 dni roboczych na rozpatrzenie Twojego żalu. Jeśli
              mamy rację – naprawimy błąd. Jeśli Ty masz rację – wyślemy nowy kubek.
            </li>
          </ul>
        </Section>

        <Section title="§6 TWOJE DANE (RODO, ALE PO LUDZKU)">
          <p>
            Twoje dane (imię, adres, telefon) wykorzystujemy tylko po to, żeby wysłać Ci kubek i
            wystawić rachunek. Nie sprzedajemy ich handlarzom dywanów ani nie dzwonimy z ofertą
            garnków. Administratorem danych jest Milena Bujniak. Masz prawo do wglądu, zmiany lub
            żądania usunięcia swoich danych – wystarczy mail.
          </p>
        </Section>

        <Section title="§7 PODSUMOWANIE">
          <p>
            Złożenie zamówienia oznacza, że przeczytałeś ten tekst i zgadzasz się na nasze zasady.
            Teraz wybierz swój ulubiony kubek i spraw sobie (albo komuś, kogo średnio lubisz)
            odrobinę radości!
          </p>
          <p className="text-center font-semibold">
            WrednyKubek.pl — Bo życie jest za krótkie na nudne naczynia.
          </p>
        </Section>
      </div>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}
