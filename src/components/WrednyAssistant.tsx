"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart } from "lucide-react";
import { useAssistantStore } from "@/features/assistant/useAssistantStore";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_grosze: number;
  images: unknown;
  similarity: number;
}

// ─── Hardcoded quiz data ───────────────────────────────────────────────────

const STEP1_OPTIONS = [
  "Dla taty",
  "Dla mamy",
  "Dla dziadka",
  "Dla babci",
  "Dla dziecka",
  "Dla szefa",
  "Dla kumpla",
  "Dla siebie",
];

const STEP2_MAP: Record<string, string[]> = {
  "Dla taty":    ["Grillmaster", "Pracoholik", "Fan motoryzacji", "Majsterkowicz"],
  "Dla mamy":    ["Romantyczka", "Pracująca mama", "Miłośniczka gotowania", "Ogrodniczka"],
  "Dla dziadka": ["Spokojny emeryt", "Aktywny senior", "Fan historii", "Tradycjonalista"],
  "Dla babci":   ["Romantyczka", "Aktywna seniorka", "Miłośniczka gotowania", "Tradycjonalistka"],
  "Dla dziecka": ["Przedszkolak", "Nastolatek", "Fan gamingu", "Uczennica / Uczeń"],
  "Dla szefa":   ["Wymagający szef", "Luzak w garniturze", "Workaholic", "Szef który wie wszystko"],
  "Dla kumpla":  ["Narzekacz", "Wieczny optymista", "Programista / IT", "Kreatywny chaos"],
  "Dla siebie":  ["Potrzebuję motywacji", "Lubię czarny humor", "Kawa = życie", "Pracuję z domu"],
};

const STEP3_OPTIONS = [
  "Ironista / sarkasta",
  "Wesoły pozytywiak",
  "Poważny i skupiony",
  "Romantyczny / wrażliwy",
  "Chroniczny marudzący",
];

type QuizStep = "greeting" | "step1" | "step2" | "step3" | "loading" | "results";

// ─── Radio option component ────────────────────────────────────────────────
function RadioOption({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 w-full rounded-2xl border-2 px-4 py-3 text-left text-base font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${
        selected
          ? "border-[#40C4A4] bg-[#40C4A4]/15"
          : "border-border bg-muted/30 hover:border-[#40C4A4]/60 hover:bg-[#40C4A4]/5"
      }`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? "border-[#40C4A4]" : "border-muted-foreground/40"
      }`}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#40C4A4]" />}
      </span>
      {label}
    </button>
  );
}

// ─── Dots loader ──────────────────────────────────────────────────────────
function Dots() {
  return (
    <div className="flex justify-center gap-1.5 py-4">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:0ms]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:150ms]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:300ms]" />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export function WrednyAssistant() {
  const { isOpen, close } = useAssistantStore();

  const [step, setStep] = React.useState<QuizStep>("greeting");
  const [forWhom, setForWhom] = React.useState("");
  const [style, setStyle] = React.useState("");
  const [character, setCharacter] = React.useState("");
  const [selected, setSelected] = React.useState("");

  const [products, setProducts] = React.useState<Product[]>([]);
  const [comment, setComment] = React.useState("");
  const [isFallback, setIsFallback] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // slide animation
  const [sliding, setSliding] = React.useState<"out" | "in" | "idle">("idle");

  function goTo(nextStep: QuizStep, afterMs = 0) {
    setSliding("out");
    setTimeout(() => {
      setSelected("");
      if (afterMs > 0) {
        setTimeout(() => {
          setStep(nextStep);
          setSliding("in");
          setTimeout(() => setSliding("idle"), 320);
        }, afterMs);
      } else {
        setStep(nextStep);
        setSliding("in");
        setTimeout(() => setSliding("idle"), 320);
      }
    }, 260);
  }

  function handleClose() {
    close();
    setStep("greeting");
    setForWhom(""); setStyle(""); setCharacter(""); setSelected("");
    setProducts([]); setComment(""); setIsFallback(false); setLoading(false);
  }

  async function runSearch(char: string) {
    setLoading(true);
    setStep("loading");
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forWhom, style, character: char }),
      });
      const data = await res.json();
      setComment(data.comment ?? "");
      setProducts(data.products ?? []);
      setIsFallback(data.isFallback ?? false);
    } catch {
      setComment("Coś poszło nie tak. Spróbuj ponownie.");
      setProducts([]);
    } finally {
      setLoading(false);
      setStep("results");
    }
  }

  const slideClass =
    sliding === "out" ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100";

  if (!isOpen) return null;

  const step2Options = STEP2_MAP[forWhom] ?? [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="flex h-[min(90vh,660px)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-background shadow-2xl">

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#40C4A4]/30 bg-[#40C4A4]/10 px-5 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow ring-2 ring-[#40C4A4]/50">
            <Image src="/wredny.svg" alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Wredny Doradca AI</p>
            <p className="text-xs text-muted-foreground">Quiz w 3 krokach → idealny kubek</p>
          </div>
          <button onClick={handleClose} aria-label="Zamknij"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Quiz body ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className={`flex flex-1 flex-col overflow-y-auto px-6 pt-6 pb-4 transition-all duration-300 ease-out ${slideClass}`}>

            {/* ── GREETING ── */}
            {step === "greeting" && (
              <div className="flex flex-1 flex-col items-center justify-center text-center gap-6">
                <Image src="/wredny.svg" alt="" width={72} height={72} className="h-[72px] w-[72px]" unoptimized />
                <div>
                  <h2 className="text-xl font-bold mb-2">Hej, jestem Wredny Doradca</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    3 pytania i znajdę kubek, który idealnie pasuje do osoby, dla której szukasz prezentu.
                  </p>
                </div>
                <button
                  onClick={() => goTo("step1")}
                  className="rounded-2xl bg-[#40C4A4] px-8 py-3 text-sm font-bold text-white shadow hover:bg-[#40C4A4]/90 transition-all active:scale-95"
                >
                  Zaczynamy!
                </button>
              </div>
            )}

            {/* ── STEP 1: Dla kogo? ── */}
            {step === "step1" && (
              <div className="flex flex-1 flex-col">
                <StepDots current={1} />
                <h2 className="mb-1 text-xl font-bold">Dla kogo szukasz?</h2>
                <p className="mb-4 text-sm text-muted-foreground">Wybierz jedną opcję</p>
                <div className="flex flex-col gap-2 overflow-y-auto">
                  {STEP1_OPTIONS.map((opt) => (
                    <RadioOption key={opt} label={opt} selected={selected === opt}
                      onClick={() => setSelected(opt)} disabled={false} />
                  ))}
                </div>
                <button
                  onClick={() => { setForWhom(selected); goTo("step2"); }}
                  disabled={!selected}
                  className="mt-4 w-full rounded-2xl bg-[#40C4A4] py-3 text-sm font-bold text-white shadow disabled:opacity-40 hover:bg-[#40C4A4]/90"
                >
                  Dalej →
                </button>
              </div>
            )}

            {/* ── STEP 2: Jaki typ? ── */}
            {step === "step2" && (
              <div className="flex flex-1 flex-col">
                <StepDots current={2} />
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Wybrałeś:</span>
                  <span className="rounded-full bg-[#40C4A4]/15 px-2.5 py-0.5 font-semibold text-foreground">{forWhom}</span>
                </div>
                <h2 className="mb-1 text-xl font-bold">Jaki to typ?</h2>
                <p className="mb-4 text-sm text-muted-foreground">Wybierz pasujący opis</p>
                <div className="flex flex-col gap-2 overflow-y-auto">
                  {step2Options.map((opt) => (
                    <RadioOption key={opt} label={opt} selected={selected === opt}
                      onClick={() => setSelected(opt)} disabled={false} />
                  ))}
                </div>
                <button
                  onClick={() => { setStyle(selected); goTo("step3"); }}
                  disabled={!selected}
                  className="mt-4 w-full rounded-2xl bg-[#40C4A4] py-3 text-sm font-bold text-white shadow disabled:opacity-40 hover:bg-[#40C4A4]/90"
                >
                  Dalej →
                </button>
              </div>
            )}

            {/* ── STEP 3: Charakter ── */}
            {step === "step3" && (
              <div className="flex flex-1 flex-col">
                <StepDots current={3} />
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Wybrałeś:</span>
                  <span className="rounded-full bg-[#40C4A4]/15 px-2.5 py-0.5 font-semibold text-foreground">{forWhom}</span>
                  <span className="rounded-full bg-[#40C4A4]/15 px-2.5 py-0.5 font-semibold text-foreground">{style}</span>
                </div>
                <h2 className="mb-1 text-xl font-bold">Jaki ma charakter?</h2>
                <p className="mb-4 text-sm text-muted-foreground">Ostatnie pytanie, obiecuję</p>
                <div className="flex flex-col gap-2 overflow-y-auto">
                  {STEP3_OPTIONS.map((opt) => (
                    <RadioOption key={opt} label={opt} selected={selected === opt}
                      onClick={() => setSelected(opt)} disabled={false} />
                  ))}
                </div>
                <button
                  onClick={() => { const c = selected; setCharacter(c); runSearch(c); }}
                  disabled={!selected || loading}
                  className="mt-4 w-full rounded-2xl bg-[#40C4A4] py-3 text-sm font-bold text-white shadow disabled:opacity-40 hover:bg-[#40C4A4]/90"
                >
                  Szukaj kubka! 🔍
                </button>
              </div>
            )}

            {/* ── LOADING ── */}
            {step === "loading" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <Dots />
                <p className="text-sm text-muted-foreground">Szukam idealnego kubka…</p>
              </div>
            )}

            {/* ── RESULTS ── */}
            {step === "results" && (
              <div className="flex flex-1 flex-col gap-4">
                {comment && (
                  <p className="rounded-2xl bg-[#40C4A4]/10 px-4 py-3 text-sm font-medium italic text-foreground">
                    „{comment}"
                  </p>
                )}

                {isFallback && products.length > 0 && (
                  <p className="text-xs text-muted-foreground -mt-2">
                    Brak dokładnych dopasowań — oto kubki z podobnych kategorii:
                  </p>
                )}

                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Brak produktów w bazie. Dodaj kubki w panelu admina.
                  </p>
                ) : (
                  /* ── Horizontal snap carousel ── */
                  <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-6 px-6">
                    {products.map((p) => {
                      const imgs = Array.isArray(p.images) ? p.images as string[] : [];
                      const imgSrc = imgs[0] ?? null;
                      return (
                        <Link
                          key={p.id}
                          href={`/sklep/${p.slug}`}
                          onClick={handleClose}
                          className="snap-start shrink-0 w-44 flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-[#40C4A4]/60 transition-all active:scale-[0.97]"
                        >
                          <div className="relative h-44 w-full bg-muted overflow-hidden">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={p.title}
                                fill
                                className="object-cover"
                                sizes="176px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 p-3">
                            <p className="line-clamp-2 text-xs font-semibold leading-tight">{p.title}</p>
                            <p className="text-sm font-bold text-[#40C4A4]">
                              {(p.price_grosze / 100).toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => goTo("greeting")}
                  className="mt-auto w-full rounded-2xl border-2 border-[#40C4A4]/60 py-3 text-sm font-semibold text-[#40C4A4] hover:bg-[#40C4A4]/10"
                >
                  Zacznij od nowa
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step progress dots ────────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <div className="mb-5 flex gap-1.5">
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-1.5 rounded-full transition-all duration-300 ${n <= current ? "w-6 bg-[#40C4A4]" : "w-1.5 bg-border"}`} />
      ))}
    </div>
  );
}
