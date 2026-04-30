"use client";

import * as React from "react";
import { Check, Copy, ImageOff, Mail, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Shipping = {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  shippingMethod?: string;
  shippingMethodName?: string;
  parcelCode?: string;
  note?: string;
  shippingCarrier?: string | null;
};

export function OrderShippingActions({
  shipping,
  orderId,
  status,
}: {
  shipping: Shipping | null;
  orderId: string;
  status: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  async function sendShippingEmail() {
    setSendingEmail(true);
    try {
      const res = await fetch("/api/orders/send-shipping-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        console.error("[send-shipping-email] Response:", body);
        const msg = body?.error ?? "Nieznany błąd";
        const hint = body?.hint ? `\n\n💡 ${body.hint}` : "";
        alert(`Nie udało się wysłać emaila:\n\n${msg}${hint}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Błąd wysyłania emaila.");
    } finally {
      setSendingEmail(false);
    }
  }

  const isShipped = status === "SHIPPED" || status === "DELIVERED";

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={!shipping}
      >
        <Tag className="h-3 w-3" />
        Pokaż etykietę
      </Button>

      {isShipped && (
        <Button
          size="sm"
          variant="outline"
          onClick={sendShippingEmail}
          disabled={sendingEmail || emailSent}
          className={emailSent ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20" : ""}
        >
          {emailSent ? (
            <>
              <Check className="h-3 w-3" />
              Email wysłany
            </>
          ) : (
            <>
              <Mail className="h-3 w-3" />
              {sendingEmail ? "Wysyłanie..." : "Wyślij email o wysyłce"}
            </>
          )}
        </Button>
      )}

      {open && (
        <LabelDialog
          shipping={shipping ?? {}}
          orderId={orderId}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function LabelDialog({
  shipping,
  orderId,
  onClose,
}: {
  shipping: Shipping;
  orderId: string;
  onClose: () => void;
}) {
  // ESC zamyka.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fields: { label: string; value: string | undefined }[] = [
    { label: "Imię i nazwisko", value: shipping.fullName },
    { label: "Telefon", value: shipping.phone },
    { label: "Adres", value: shipping.address },
    {
      label: "Miasto",
      value:
        shipping.city && shipping.zip
          ? `${shipping.zip} ${shipping.city}`
          : shipping.city,
    },
    { label: "Kod paczkomatu", value: shipping.parcelCode },
    { label: "Sposób dostawy", value: shipping.shippingMethodName },
    { label: "Uwagi", value: shipping.note },
    { label: "Nr zamówienia", value: orderId },
  ].filter((f) => Boolean(f.value));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold">Etykieta wysyłkowa</h2>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[70vh] space-y-2 overflow-y-auto px-5 py-4">
          {fields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              <ImageOff className="mx-auto mb-2 h-6 w-6" />
              Brak danych wysyłkowych dla tego zamówienia.
            </div>
          ) : (
            fields.map((f) => (
              <CopyRow
                key={f.label}
                label={f.label}
                value={f.value as string}
              />
            ))
          )}
          <CopyRow
            label="Wszystko (do wklejenia)"
            value={fields.map((f) => `${f.label}: ${f.value}`).join("\n")}
            multiline
          />
        </div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-start gap-2">
        <p
          className={`flex-1 break-words text-sm font-medium ${
            multiline ? "whitespace-pre-line" : ""
          }`}
        >
          {value}
        </p>
        <button
          onClick={copy}
          aria-label={`Skopiuj ${label}`}
          className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-medium transition ${
            copied
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
              : "border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
          }`}
        >
          {copied ? (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3 w-3" />
              Skopiowano
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Copy className="h-3 w-3" />
              Kopiuj
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export function OrderThumbnail({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted-foreground">
          <ImageOff className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
