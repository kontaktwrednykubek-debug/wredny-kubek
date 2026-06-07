"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Send, ShoppingCart } from "lucide-react";
import { useAssistantStore } from "@/features/assistant/useAssistantStore";

interface Message { role: "user" | "assistant"; content: string; }

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_grosze: number;
  images: string[] | null;
  similarity: number;
}

interface Page {
  question: string;
  options: string[];
  products: Product[];
  previousAnswer?: string;
}

export function WrednyAssistant() {
  const { isOpen, close } = useAssistantStore();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [pages, setPages] = React.useState<Page[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  // page-flip animation state
  const [exiting, setExiting] = React.useState(false);
  const [entering, setEntering] = React.useState(false);

  const currentPage = pages[pages.length - 1] ?? null;
  const step = pages.length; // 0 = not started

  // Start quiz when dialog opens
  React.useEffect(() => {
    if (isOpen && pages.length === 0) {
      callApi([{ role: "user", content: "start" }]);
    }
  }, [isOpen]);

  async function callApi(apiMessages: Message[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newPage: Page = {
        question: data.content ?? "",
        options: data.options ?? [],
        products: data.products ?? [],
        previousAnswer: apiMessages.at(-1)?.role === "user"
          ? apiMessages.at(-1)!.content
          : undefined,
      };
      flipToPage(newPage);
    } catch {
      flipToPage({
        question: "Coś poszło nie tak. Sprawdź klucz GEMINI_API_KEY w .env.local.",
        options: [],
        products: [],
      });
    } finally {
      setLoading(false);
    }
  }

  function flipToPage(page: Page) {
    if (pages.length === 0) {
      // First page — just appear
      setPages([page]);
      setEntering(true);
      setTimeout(() => setEntering(false), 350);
      return;
    }
    // Animate out current page, then swap in new one
    setExiting(true);
    setTimeout(() => {
      setPages((prev) => [...prev, page]);
      setExiting(false);
      setEntering(true);
      setTimeout(() => setEntering(false), 350);
    }, 280);
  }

  function sendAnswer(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    callApi(updated);
  }

  function handleClose() {
    close();
    setMessages([]);
    setPages([]);
    setInput("");
  }

  if (!isOpen) return null;

  const animClass = exiting
    ? "translate-x-[-110%] opacity-0"
    : entering
    ? "translate-x-0 opacity-100"
    : "translate-x-0 opacity-100";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="flex h-[min(88vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-background shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#40C4A4]/30 bg-[#40C4A4]/10 px-5 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow ring-2 ring-[#40C4A4]/50">
            <Image src="/wredny.svg" alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">Wredny Doradca AI</p>
            <p className="text-xs text-muted-foreground truncate">Znajdę Ci kubek, który odzwierciedli Twój charakter</p>
          </div>
          <button onClick={handleClose} aria-label="Zamknij"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quiz page — slide/flip area */}
        <div className="flex-1 overflow-hidden">
          {loading && pages.length === 0 ? (
            /* Initial loading */
            <div className="flex h-full items-center justify-center gap-2">
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:0ms]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:150ms]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:300ms]" />
            </div>
          ) : currentPage ? (
            <div className={`flex h-full flex-col px-6 pt-6 pb-4 transition-all duration-300 ease-out ${animClass}`}>
              {/* Previous answer chip */}
              {currentPage.previousAnswer && currentPage.previousAnswer !== "start" && (
                <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">Wybrałeś:</span>
                  <span className="rounded-full bg-[#40C4A4]/15 px-3 py-1 font-semibold text-foreground">
                    {currentPage.previousAnswer}
                  </span>
                </div>
              )}

              {/* Step dots */}
              {step > 0 && currentPage.products.length === 0 && (
                <div className="mb-5 flex gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`h-1.5 rounded-full transition-all duration-300 ${n <= step ? "w-6 bg-[#40C4A4]" : "w-1.5 bg-border"}`} />
                  ))}
                </div>
              )}

              {/* Question text */}
              <p className="mb-6 text-lg font-bold leading-snug text-foreground whitespace-pre-wrap">
                {currentPage.question}
              </p>

              {/* Products (results page) */}
              {currentPage.products.length > 0 && (
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {currentPage.products.map((p) => {
                    const imgSrc = Array.isArray(p.images) ? p.images[0] : null;
                    return (
                      <Link key={p.id} href={`/sklep/${p.slug}`} onClick={handleClose}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 hover:bg-muted transition-colors">
                        {imgSrc && (
                          <Image src={imgSrc} alt={p.title} width={56} height={56}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{p.title}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                          <p className="mt-1 text-sm font-bold text-[#40C4A4]">
                            {(p.price_grosze / 100).toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                          </p>
                        </div>
                        <ShoppingCart className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Options (quiz choices) */}
              {currentPage.options.length > 0 && currentPage.products.length === 0 && (
                <div className="mt-auto grid grid-cols-1 gap-2">
                  {currentPage.options.map((opt, i) => (
                    <button key={i} onClick={() => sendAnswer(opt)} disabled={loading}
                      className="w-full rounded-2xl border-2 border-[#40C4A4]/60 bg-[#40C4A4]/5 px-4 py-3 text-left text-sm font-medium transition-all hover:border-[#40C4A4] hover:bg-[#40C4A4]/10 active:scale-[0.98] disabled:opacity-50">
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading indicator while waiting for next page */}
              {loading && (
                <div className="mt-4 flex justify-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#40C4A4] [animation-delay:300ms]" />
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Text input at bottom */}
        <div className="shrink-0 border-t border-border p-3">
          <form onSubmit={(e) => { e.preventDefault(); sendAnswer(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Wpisz odpowiedź lub kliknij opcję..."
              disabled={loading}
              className="flex-1 rounded-full border border-border bg-muted px-4 py-2 text-sm outline-none focus:border-[#40C4A4] disabled:opacity-50"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Wyślij"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#40C4A4] text-white shadow disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
