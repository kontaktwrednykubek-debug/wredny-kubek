"use client";

import * as React from "react";
import { X, Send, Loader2, Lock, MessageCircle } from "lucide-react";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string };
type Screen = "info" | "login_gate" | "chat" | "no_tokens";

export function WrednyChatModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = React.useState<Screen>("info");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [questionsLeft, setQuestionsLeft] = React.useState<number | null>(null);
  const [checkingAuth, setCheckingAuth] = React.useState(false);
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function checkAuthAndStart() {
    setCheckingAuth(true);
    try {
      const res = await fetch("/api/wredny-chat");
      const data = await res.json();
      if (!data.authenticated) {
        setScreen("login_gate");
      } else if (data.questionsLeft <= 0) {
        setScreen("no_tokens");
      } else {
        setQuestionsLeft(data.questionsLeft);
        setScreen("chat");
      }
    } finally {
      setCheckingAuth(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/wredny-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-8), message: text }),
      });
      const data = await res.json();

      if (res.status === 401) { setScreen("login_gate"); return; }
      if (res.status === 403) { setScreen("no_tokens"); return; }
      if (!res.ok) { setMessages((prev) => [...prev, { role: "assistant", content: "Coś poszło nie tak. Spróbuj ponownie." }]); return; }

      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      setQuestionsLeft(data.questionsLeft);
      if (data.questionsLeft <= 0) {
        setTimeout(() => setScreen("no_tokens"), 2000);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 flex w-full max-w-md flex-col rounded-t-3xl sm:rounded-3xl bg-background shadow-2xl border border-border"
        style={{ height: "min(85vh, 640px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#40C4A4]/20 text-lg">🤖</div>
            <div>
              <p className="text-sm font-bold">Wredny AI</p>
              <p className="text-[11px] text-muted-foreground">Asystent z charakterem</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── INFO SCREEN ── */}
        {screen === "info" && (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            <div className="rounded-2xl bg-[#40C4A4]/10 p-4 text-sm space-y-2">
              <p className="font-bold text-base">🔒 Prywatność przede wszystkim</p>
              <p className="text-muted-foreground">Ta rozmowa <strong>nie jest nigdzie rejestrowana</strong> i pozostaje prywatna. Rozmawiasz tylko z nami i Gemini.</p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>🎁 Powiedz mi dla kogo szukasz kubka, a dobiorę coś co rozbawi nawet marudę.</p>
              <p>⚡ Grzecznych asystentów jest wszędzie pełno. Ten mówi Ci prawdę.</p>
            </div>
            <div className="mt-auto space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#40C4A4] shrink-0"
                />
                <span className="text-muted-foreground">Mam <strong className="text-foreground">ukończone 18 lat</strong> i wyrażam zgodę na rozmowę z asystentem AI.</span>
              </label>
              <button
                onClick={checkAuthAndStart}
                disabled={checkingAuth || !ageConfirmed}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#40C4A4] py-3 text-sm font-bold text-white hover:bg-[#40C4A4]/90 transition-colors disabled:opacity-40"
              >
                {checkingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                {checkingAuth ? "Sprawdzam..." : "Zacznijmy gadać"}
              </button>
            </div>
          </div>
        )}

        {/* ── LOGIN GATE ── */}
        {screen === "login_gate" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold">Odblokuj bezcenzuralnego Asystenta AI</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Zaloguj się jednym kliknięciem i odbierz <strong>7 darmowych pytań</strong>.
              </p>
            </div>
            <Link
              href="/login"
              onClick={onClose}
              className="w-full rounded-2xl bg-[#40C4A4] py-3 text-center text-sm font-bold text-white hover:bg-[#40C4A4]/90 transition-colors"
            >
              Zaloguj się przez Google
            </Link>
            <button onClick={onClose} className="text-xs text-muted-foreground hover:underline">
              Może później
            </button>
          </div>
        )}

        {/* ── NO TOKENS ── */}
        {screen === "no_tokens" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
            <div className="text-4xl">💸</div>
            <div>
              <p className="text-lg font-bold">Wykorzystałeś darmowe pytania</p>
              <p className="mt-1 text-sm text-muted-foreground">
                7 pytań za darmo to i tak sporo. Chcesz więcej? Rozmawiaj bez limitów z pakietem Premium.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-2xl border-2 border-[#40C4A4] py-3 text-sm font-bold text-[#40C4A4] hover:bg-[#40C4A4]/10 transition-colors"
            >
              Zamknij
            </button>
          </div>
        )}

        {/* ── CHAT ── */}
        {screen === "chat" && (
          <>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lg">🤖</span>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                    Hej! Ta rozmowa jest prywatna i nigdzie niezapisywana. Dla kogo szukasz kubka?
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  {m.role === "assistant" && <span className="mt-0.5 shrink-0 text-lg">🤖</span>}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "rounded-tr-sm bg-[#40C4A4] text-white"
                        : "rounded-tl-sm bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lg">🤖</span>
                  <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-muted px-3 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  rows={1}
                  onChange={(e) => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                  placeholder="Napisz coś... (Enter = wyślij, Shift+Enter = nowa linia)"
                  className="flex-1 resize-none overflow-hidden rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40C4A4] leading-[1.5]"
                  disabled={loading}
                  maxLength={500}
                  style={{ minHeight: "38px", maxHeight: "120px" }}
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={loading || !input.trim()}
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#40C4A4] text-white disabled:opacity-40 hover:bg-[#40C4A4]/90 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
