"use client";

import * as React from "react";
import { Loader2, Paperclip, Send, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FILES = 6;
const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function CustomProjectForm() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, MAX_FILES));
    setError(null);
  }
  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    // FormData z <input multiple> nie zbierze plików zarządzanych stanem — dodajemy ręcznie.
    fd.delete("files");
    files.forEach((f) => fd.append("files", f));

    setSending(true);
    try {
      const res = await fetch("/api/custom-project", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Nie udało się wysłać. Spróbuj ponownie.");
        return;
      }
      setDone(true);
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-primary" />
        <h3 className="text-xl font-extrabold">Wysłane! Mamy Twój pomysł ☕</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Przygotujemy wizualizację i wycenę, a potem odezwiemy się na podany
          e-mail. Nic nie płacisz, dopóki nie zaakceptujesz projektu.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Imię *</span>
          <input name="name" required className={inputCls} placeholder="Jak się do Ciebie zwracać" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">E-mail *</span>
          <input name="email" type="email" required className={inputCls} placeholder="twoj@email.pl" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Telefon (opcjonalnie)</span>
        <input name="phone" className={inputCls} placeholder="np. 600 100 200" />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Opis projektu *</span>
        <textarea
          name="description"
          required
          rows={5}
          className={`${inputCls} resize-y`}
          placeholder="Opisz, co ma być na kubku: tekst, kolory, styl, dla kogo, na jaką okazję. Im więcej szczegółów, tym lepiej."
        />
      </label>

      {/* Honeypot — ukryte pole na boty */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      {/* Załączniki */}
      <div>
        <span className="mb-1 block text-sm font-medium">
          Twoje pliki / grafika (zdjęcia lub PDF, do {MAX_FILES})
        </span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
          Załącz pliki
        </button>
        <input
          ref={fileRef}
          type="file"
          name="files"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Usuń plik"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={sending} className="w-full">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Wysyłanie…" : "Wyślij projekt — bezpłatna wycena"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Wysyłając, zgadzasz się, abyśmy skontaktowali się z Tobą w sprawie wyceny.
        Nic nie płacisz, dopóki nie zaakceptujesz projektu.
      </p>
    </form>
  );
}
