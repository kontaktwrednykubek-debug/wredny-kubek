"use client";

import * as React from "react";
import Image from "next/image";
import { X, Send, Bot } from "lucide-react";
import { useAssistantStore } from "@/features/assistant/useAssistantStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function parseResponse(text: string): { body: string; options: string[] } {
  const lines = text.split("\n");
  const options: string[] = [];
  const bodyLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\[OPCJA\]\s*(.+)/);
    if (match) {
      options.push(match[1].trim());
    } else {
      bodyLines.push(line);
    }
  }

  return { body: bodyLines.join("\n").trim(), options };
}

export function WrednyAssistant() {
  const { isOpen, close } = useAssistantStore();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [options, setOptions] = React.useState<string[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      callApi([{ role: "user", content: "start" }], true);
    }
  }, [isOpen]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function callApi(apiMessages: Message[], isGreeting = false) {
    setLoading(true);
    setOptions([]);
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const { body, options: newOptions } = parseResponse(data.content);

      setMessages((prev) =>
        isGreeting
          ? [{ role: "assistant", content: body }]
          : [...prev, { role: "assistant", content: body }],
      );
      setOptions(newOptions);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Przepraszam, coś poszło nie tak. Sprawdź klucz OPENAI_API_KEY w .env.local.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function sendUserMessage(text: string) {
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
    setOptions([]);
    setInput("");
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center md:p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="flex h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl md:h-[620px] md:w-[500px] md:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#40C4A4]/30 bg-[#40C4A4]/10 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-[#40C4A4]/40">
            <Image
              src="/wredny.svg"
              alt="Wredny Doradca"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              unoptimized
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Wredny Doradca AI</p>
            <p className="text-xs text-muted-foreground">
              Pomogę wybrać idealny kubek na prezent
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {m.role === "assistant" && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#40C4A4]/20">
                  <Bot className="h-4 w-4 text-[#40C4A4]" />
                </div>
              )}
              <div
                className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#40C4A4]/20">
                <Bot className="h-4 w-4 text-[#40C4A4]" />
              </div>
              <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {options.length > 0 && !loading && (
            <div className="flex flex-wrap gap-2 pt-1">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => sendUserMessage(opt)}
                  className="rounded-full border-2 border-[#40C4A4] px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-[#40C4A4]/10"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendUserMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Napisz coś lub kliknij opcję..."
              disabled={loading}
              className="flex-1 rounded-full border border-border bg-muted px-4 py-2 text-sm outline-none focus:border-[#40C4A4] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#40C4A4] text-white shadow transition-transform hover:scale-105 disabled:opacity-40"
              aria-label="Wyślij"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
