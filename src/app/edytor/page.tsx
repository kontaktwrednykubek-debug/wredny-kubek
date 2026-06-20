import type { Metadata } from "next";
import { Upload, Palette, BadgeCheck, Truck, Sparkles } from "lucide-react";
import { CustomProjectForm } from "./CustomProjectForm";

export const metadata: Metadata = {
  title: "Twój Projekt — zaprojektujemy Twój kubek",
  description:
    "Masz pomysł na własny kubek? Wyślij nam grafikę i opis — przygotujemy wizualizację i wycenę. Płacisz dopiero po akceptacji projektu.",
};

const STEPS = [
  {
    icon: Upload,
    title: "1. Wyślij pomysł",
    text: "Załącz swoją grafikę lub zdjęcie i opisz, co ma znaleźć się na kubku — tekst, kolory, styl, okazję.",
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
          Masz w głowie konkretny projekt? Prześlij nam swoją grafikę lub zdjęcie,
          a my zamienimy je w gotowy, dopracowany nadruk. Bez kombinowania z
          edytorem — zajmiemy się tym za Ciebie, żeby efekt był dokładnie taki,
          jak na podglądzie. <strong className="text-foreground">Wycena jest
          bezpłatna, a płacisz dopiero po akceptacji projektu.</strong>
        </p>
      </div>

      {/* JAK TO DZIAŁA */}
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* DLACZEGO MAILEM / FORMULARZEM */}
      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-amber-300/50 bg-amber-50/60 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <p>
          <strong>Dlaczego nie ma edytora na żywo?</strong> Bo zależy nam na
          jakości. Grafiki wysyłane prosto z telefonu potrafią stracić
          rozdzielczość albo przesunąć się przy podglądzie — a Ty zobaczyłbyś
          inny efekt niż na gotowym kubku. Dlatego Twój projekt przygotowuje nasz
          grafik i pokazuje Ci finalną wizualizację, zanim cokolwiek wydrukujemy.
        </p>
      </div>

      {/* FORMULARZ */}
      <div className="mx-auto mt-12 max-w-2xl">
        <h2 className="mb-4 text-center text-2xl font-extrabold">
          Wyślij swój projekt
        </h2>
        <CustomProjectForm />
      </div>
    </div>
  );
}
