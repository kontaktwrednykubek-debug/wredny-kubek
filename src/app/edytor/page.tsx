import type { Metadata } from "next";
import {
  Upload,
  Palette,
  BadgeCheck,
  Truck,
  Sparkles,
  Mail,
  ImageIcon,
  Wallet,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Twój Projekt — zaprojektujemy Twój kubek",
  description:
    "Masz pomysł na własny kubek? Wyślij nam grafikę mailem — przygotujemy wizualizację i wycenę. Płacisz dopiero po akceptacji projektu.",
};

const SHOP_EMAIL = "wrednykubek@gmail.com";

const MAIL_SUBJECT = "Mój projekt na kubek";
const MAIL_BODY = `Cześć! Chcę zamówić własny projekt na kubek.

➤ Mój pomysł (opisz: tekst, kolory, styl, na jaką okazję):
-

➤ Pamiętaj, aby załączyć swoją grafikę lub zdjęcie do tej wiadomości 📎

Imię:
Telefon (opcjonalnie):`;

const MAILTO = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(MAIL_BODY)}`;

const STEPS = [
  {
    icon: Upload,
    title: "1. Wyślij pomysł",
    text: "Załącz swoją grafikę lub zdjęcie i napisz, co ma znaleźć się na kubku — tekst, kolory, styl, okazję.",
  },
  {
    icon: Palette,
    title: "2. Robimy wizualizację",
    text: "Nasz grafik przygotuje projekt w wysokiej jakości i dopracuje szczegóły, żeby nadruk wyszedł idealnie.",
  },
  {
    icon: BadgeCheck,
    title: "3. Akceptujesz i wyceniasz",
    text: "Dostajesz podgląd i wycenę. Coś poprawić? Zmieniamy. Płacisz dopiero, gdy projekt Ci się spodoba.",
  },
  {
    icon: Truck,
    title: "4. Drukujemy i wysyłamy",
    text: "Po akceptacji finalizujemy zamówienie, drukujemy trwałą metodą sublimacji i wysyłamy pod Twoje drzwi.",
  },
];

const BENEFITS = [
  {
    icon: ImageIcon,
    title: "Oryginalna jakość, zero kompresji",
    text: "Wysyłasz plik prosto ze swojej skrzynki — w pełnej rozdzielczości. Nic się nie psuje po drodze, więc nadruk wychodzi ostry jak Twoja grafika.",
  },
  {
    icon: Wallet,
    title: "Bezpłatna wycena",
    text: "Odpowiadamy z gotową wizualizacją i ceną. Bez zobowiązań — decydujesz na spokojnie.",
  },
  {
    icon: ShieldCheck,
    title: "Płacisz po akceptacji",
    text: "Najpierw widzisz finalny projekt, dopiero potem finalizujesz zamówienie. Zero ryzyka, że wyjdzie nie tak.",
  },
];

export default function CustomProjectPage() {
  return (
    <div className="container mx-auto px-5 py-14 sm:px-6 md:py-20 lg:px-10 xl:px-12">
      {/* HERO */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Projekt na zamówienie
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Twój pomysł — nasz kubek
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Masz w głowie konkretny projekt? Wyślij nam swoją grafikę prosto ze
          swojej skrzynki — a my zamienimy ją w gotowy, dopracowany nadruk.{" "}
          <strong className="text-foreground">
            Wycena jest bezpłatna, a płacisz dopiero po akceptacji projektu.
          </strong>
        </p>

        {/* GŁÓWNE CTA — otwiera skrzynkę klienta z gotowym mailem */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <a
            href={MAILTO}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-base font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Mail className="h-5 w-5" />
            Wyślij projekt mailem
          </a>
          <p className="text-xs text-muted-foreground">
            Otworzy się Twoja poczta z gotową wiadomością — wystarczy, że dołączysz
            plik i klikniesz wyślij. Albo napisz na{" "}
            <a href={`mailto:${SHOP_EMAIL}`} className="font-semibold text-primary underline underline-offset-2">
              {SHOP_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>

      {/* KORZYŚCI */}
      <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <b.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-bold">{b.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
          </div>
        ))}
      </div>

      {/* JAK TO DZIAŁA */}
      <div className="mx-auto mt-14 max-w-5xl">
        <h2 className="mb-6 text-center text-2xl font-extrabold sm:text-3xl">
          Jak to działa?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DLACZEGO MAILEM */}
      <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-amber-300/50 bg-amber-50/60 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <p>
          <strong>Dlaczego mailem, a nie przez edytor na żywo?</strong> Bo zależy
          nam na jakości Twojego kubka. Grafiki przesyłane przez przeglądarkę
          potrafią się skompresować albo przesunąć przy podglądzie — i efekt
          wychodzi inny, niż się spodziewasz. Wysyłając plik bezpośrednio z
          maila, dajesz nam oryginał w pełnej jakości, a nasz grafik dopnie
          projekt na ostatni guzik i pokaże Ci wizualizację, zanim cokolwiek
          wydrukujemy.
        </p>
      </div>

      {/* CTA NA DOLE */}
      <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-extrabold">Gotowy na swój kubek?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Napisz do nas, dołącz grafikę i powiedz, co chcesz osiągnąć. Resztą
          zajmiemy się my — łącznie z bezpłatną wyceną.
        </p>
        <a
          href={MAILTO}
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-base font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Mail className="h-5 w-5" />
          Wyślij projekt mailem
        </a>
      </div>
    </div>
  );
}
