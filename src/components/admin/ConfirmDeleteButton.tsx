"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Przycisk „Usuń" z potwierdzeniem w miejscu (bez window.confirm, który w
 * niektórych przeglądarkach / webview jest blokowany i od razu zwraca false).
 */
export function ConfirmDeleteButton({
  onConfirm,
  busy,
  label = "Usuń",
  question = "Na pewno?",
  variant = "outline",
  className = "",
}: {
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
  label?: string;
  question?: string;
  variant?: "outline" | "ghost";
  className?: string;
}) {
  const [asking, setAsking] = React.useState(false);

  if (asking) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-medium text-red-600">{question}</span>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={async () => {
            await onConfirm();
            setAsking(false);
          }}
          className="gap-1 bg-red-600 text-white hover:bg-red-700"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Tak, usuń
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setAsking(false)}>
          Nie
        </Button>
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={busy}
      onClick={() => setAsking(true)}
      className={`gap-1 text-red-600 hover:bg-red-50 ${className}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
