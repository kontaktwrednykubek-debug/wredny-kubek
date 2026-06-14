import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Regulamin sklepu – WrednyKubek.pl",
  description: "Regulamin sklepu internetowego WrednyKubek.pl — prawa i obowiązki kupującego i sprzedawcy.",
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

      {/* ── SKRÓT ── */}
      <div className="mb-12 rounded-2xl border border-border bg-muted/50 px-6 py-6 space-y-4">
        <h1 className="text-2xl font-extrabold">☕ REGULAMIN SKLEPU WREDNYKUBEK.PL (W SKRÓCIE)</h1>
        <p className="text-sm text-muted-foreground">
          Składając zamówienie, akceptujesz poniższe, proste zasady:
        </p>
        <ol className="space-y-2 text-sm leading-relaxed list-decimal pl-5">
          <li>
            <strong>Kto sprzedaje:</strong> Wredny Kubek — Milena Bujniak, Świdnik 25, 58-410
            Marciszów, NIP: 6141615267. Kontakt:{" "}
            <a href="mailto:czegoznowu@wrednykubek.pl" className="text-primary underline underline-offset-4">
              czegoznowu@wrednykubek.pl
            </a>.
          </li>
          <li>
            <strong>Czas realizacji:</strong> Nasze kubki wymagają uwagi, dlatego czas realizacji
            zamówienia wynosi od 1 do 14 dni roboczych.
          </li>
          <li>
            <strong>Płatność i dostawa:</strong> Płacisz bezpiecznie przez Stripe (karta, Google
            Pay, Apple Pay) lub Przelewy24 (BLIK). Paczki dostarcza InPost (Kurier lub Paczkomat).
            Nie wysyłamy za pobraniem. Jeśli nie odbierzesz paczki z Paczkomatu i wróci do nas,
            zwrócimy Ci kasę pomniejszoną o koszt drogi powrotnej przesyłki.
          </li>
          <li>
            <strong>Zwroty (Zmiana zdania):</strong> Masz na to 14 dni od odebrania paczki.
            Odsyłasz na swój koszt. Produkt musi być czysty i nienaruszony.
          </li>
          <li>
            <strong>WYJĄTEK (Personalizacja):</strong> Jeśli zamawiasz kubek z własnym imieniem,
            napisem lub dedykacją – nie ma możliwości zwrotu. Taki produkt robimy specjalnie pod
            Ciebie.
          </li>
          <li>
            <strong>Reklamacje:</strong> Jeśli kubek przyjedzie uszkodzony lub pomylimy napisy,
            napisz do nas na{" "}
            <a href="mailto:czegoznowu@wrednykubek.pl" className="text-primary underline underline-offset-4">
              czegoznowu@wrednykubek.pl
            </a>{" "}
            (najlepiej ze zdjęciem wady). Odpowiemy w ciągu 14 dni i wyślemy nowy kubek lub
            zwrócimy kasę.
          </li>
        </ol>
        <p className="text-sm text-muted-foreground italic">
          Pełną, oficjalną wersję regulaminu znajdziesz poniżej.
        </p>
      </div>

      {/* ── PEŁNA WERSJA ── */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2 className="mb-1 text-2xl font-extrabold">☕ Regulamin Sklepu WrednyKubek.pl</h2>
        <p className="mt-0 text-sm text-muted-foreground italic">
          (Czyli co wolno Tobie, a czego nie wolno nam, choć byśmy chcieli)
        </p>

        <p className="mt-6">
          Witaj w miejscu, gdzie kawa smakuje lepiej, bo kubek ma charakter. Składając zamówienie,
          oświadczasz, że masz poczucie humoru i akceptujesz poniższe zasady. Wiemy, że nikt nie
          lubi czytać regulaminów, dlatego ubraliśmy go w ludzkie słowa, dbając jednocześnie o
          to, aby każdy paragraf był w 100% zgodny z polskim prawem, UOKiK oraz wymogami operatorów
          płatności.
        </p>

        <Section title="§1 KTO TU RZĄDZI? (DANE SPRZEDAWCY)">
          <p>Właścicielem sklepu internetowego funkcjonującego pod adresem wrednykubek.pl oraz Sprzedawcą jest:</p>
          <p>
            <strong>Wredny Kubek — Milena Bujniak</strong><br />
            Świdnik 25, 58-410 Marciszów<br />
            <strong>NIP: 6141615267</strong>
          </p>
          <p>Kontakt z nami:</p>
          <ul>
            <li>Mail: <a href="mailto:czegoznowu@wrednykubek.pl">czegoznowu@wrednykubek.pl</a></li>
            <li>Telefon: <a href="tel:+48789111041">+48 789 111 041</a></li>
          </ul>
          <p className="text-muted-foreground italic">
            Ważne: Odpowiadamy tak szybko, jak wypijemy kawę. Zazwyczaj trwa to krótką chwilę.
          </p>
        </Section>

        <Section title="§2 JAK KUPIĆ I NIE ZWARIOWAĆ?">
          <ol>
            <li>
              <strong>Bez zbędnych formalności:</strong> Nie musisz zakładać stałego konta,
              podawać imienia chomika ani przechodzić rekrutacji. Kupujesz wygodnie jako gość.
            </li>
            <li>
              <strong>Proces:</strong> Wybierasz kubek, dodajesz do koszyka, wypełniasz dane do
              wysyłki, płacisz i czekasz na kuriera. Z chwilą potwierdzenia płatności między Tobą
              a Sprzedawcą zostaje zawarta umowa sprzedaży.
            </li>
            <li>
              <strong>Czas realizacji:</strong> Nasze kubki to małe dzieła sztuki (nawet te
              najbardziej wredne). Czas przygotowania i wysyłki zamówienia trwa od 1 do 14 dni
              roboczych. Nie poganiaj nas – cierpliwość to cnota, a dobry kubek wymaga czasu.
            </li>
          </ol>
        </Section>

        <Section title="§3 KASA I PUDEŁKA (PŁATNOŚCI I DOSTAWA)">
          <ol>
            <li>
              <strong>Płatności:</strong> Akceptujemy to, co bezpieczne i wygodne. Obsługujemy
              płatności elektroniczne za pośrednictwem systemów <strong>Stripe</strong> oraz
              Przelewy24 (karty płatnicze, Google Pay, Apple Pay, BLIK) oraz przelew tradycyjny.
            </li>
            <li>
              <strong>Brak pobrań:</strong> Nie wysyłamy za pobraniem – ufamy sobie nawzajem, ale
              pieniądze wolimy widzieć zaksięgowane wcześniej.
            </li>
            <li>
              <strong>Dostawa:</strong> Twoje zamówienie dowiezie InPost (do wybranego Paczkomatu
              lub bezpośrednio Kurierem pod Twój adres). Koszty dostawy system dokładnie policzy
              w koszyku przed dokonaniem płatności.
            </li>
            <li>
              <strong>Karny Jeżyk:</strong> Jeśli nie odbierzesz paczki z Paczkomatu, bo
              zapomniałeś/aś albo Ci się nie chciało, i paczka po terminie do nas wróci –
              zwrócimy Ci pieniądze za zamówienie, ale pomniejszone o bezpośredni koszt transportu
              zwrotnego paczki do nas. Szanujmy swój czas i paliwo kuriera.
            </li>
          </ol>
        </Section>

        <Section title='§4 ZWROTY (CZYLI "JEDNAK GO NIE CHCĘ")'>
          <ol>
            <li>
              <strong>Standardowy zwrot:</strong> Masz ustawowe <strong>14 dni kalendarzowych</strong> na
              zmianę zdania i odstąpienie od umowy bez podania przyczyny (liczone od dnia odebrania
              paczki). Odsyłasz towar na swój koszt.
            </li>
            <li>
              <strong>Warunek:</strong> Produkt musi być w stanie nienaruszonym (zero śladów kawy,
              herbaty czy rzucania o ścianę) i bezpiecznie spakowany.
            </li>
            <li>
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium">
                <strong>WYJĄTEK (NAJWAŻNIEJSZE):</strong> Jeśli zamówisz{" "}
                <strong>kubek personalizowany</strong> (z Twoim własnym imieniem, dedykacją, datą
                lub napisem, który stworzyliśmy specjalnie na Twoje życzenie) –{" "}
                <strong>prawo do zwrotu bez podania przyczyny nie przysługuje</strong> (zgodnie z
                art. 38 pkt 3 ustawy o prawach konsumenta). Taki kubek jest tylko Twój i nikt inny
                z niego pić nie będzie.
              </p>
            </li>
          </ol>
        </Section>

        <Section title="§5 REKLAMACJE (GDY COŚ POSZŁO NIE TAK)">
          <ol>
            <li>
              Jeśli kubek ma wadę fabryczną, nadruk jest uszkodzony, produkt pękł w transporcie
              lub pomyliliśmy napisy – masz pełne prawo do złożenia reklamacji z tytułu niezgodności
              towaru z umową na zasadach polskiego Kodeksu Cywilnego. Odpowiadamy za wady przez
              okres <strong>2 lat</strong> od zakupu.
            </li>
            <li>
              Napisz do nas na oficjalny adres:{" "}
              <a href="mailto:czegoznowu@wrednykubek.pl">czegoznowu@wrednykubek.pl</a>, opisz
              problem, a dołączenie zdjęcia wady diametralnie przyspieszy sprawę.
            </li>
            <li>
              Na oficjalne rozpatrzenie i odpowiedź na Twoją reklamację mamy ustawowe{" "}
              <strong>14 dni</strong>. Jeśli wada jest ewidentna – zrobimy wszystko, żeby naprawić
              błąd i jak najszybciej wyślemy nowy kubek na nasz koszt lub zwrócimy Ci pieniądze.
            </li>
            <li>
              <strong>Wskazówka logistyczna:</strong> Jeśli paczka z Paczkomatu lub od kuriera
              wygląda, jakby przejechał po niej czołg, prosimy – zgłoś to przy Paczkomacie lub
              spisz protokół szkody z kurierem. Brak tego świstka nie anuluje Twojej reklamacji u
              nas, ale bardzo pomoże nam w walce o odszkodowanie od firmy kurierskiej.
            </li>
          </ol>
        </Section>

        <Section title="§6 TWOJE DANE (RODO, ALE PO LUDZKU)">
          <p>
            Twoje dane (imię, adres, telefon, e-mail) wykorzystujemy tylko i wyłącznie po to, żeby
            wysłać Ci kubek, rozliczyć księgowo zamówienie oraz wysyłać newsletter (jeśli się na
            niego zapiszesz). Nie sprzedajemy ich handlarzom dywanów ani garnków. Administratorem
            danych jest Milena Bujniak. Masz pełne prawo do wglądu, zmiany lub żądania usunięcia
            swoich danych – wystarczy nam napisać maila.
          </p>
        </Section>

        <Section title="§7 PODSUMOWANIE">
          <p>
            Złożenie zamówienia oznacza, że przeczytałeś ten tekst i zgadzasz się na nasze zasady.
            Teraz wybierz swój ulubiony kubek i spraw sobie (albo komuś, kogo średnio lubisz)
            odrobinę uzasadnionej radości!
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
