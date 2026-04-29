"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ImageOff, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const labelStatusBadge: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  GENERATED: "bg-blue-100 text-blue-800",
  PRINTED: "bg-green-100 text-green-800",
  VOIDED: "bg-red-100 text-red-700",
};

export function OrderShippingActions({
  orderId,
  status,
  carrier,
  labelUrl,
  trackingNumber,
  labelStatus,
}: {
  orderId: string;
  status: string;
  carrier: string | null;
  labelUrl: string | null;
  trackingNumber: string | null;
  labelStatus: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [tracking, setTracking] = React.useState(trackingNumber ?? "");
  const [url, setUrl] = React.useState(labelUrl ?? "");

  async function requestLabel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/label`, {
        method: "POST",
      });
      const j = await res.json();
      if (res.ok && j.furgonetkaPanelUrl) {
        window.open(j.furgonetkaPanelUrl, "_blank");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveTracking() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingTrackingNumber: tracking || undefined,
          shippingLabelUrl: url || undefined,
          shippingLabelStatus: tracking ? "GENERATED" : undefined,
        }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {labelStatus && (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            labelStatusBadge[labelStatus] ?? "bg-muted text-foreground"
          }`}
        >
          {labelStatus}
        </span>
      )}
      {trackingNumber && (
        <p className="text-xs">
          <span className="text-muted-foreground">Nr listu:</span>{" "}
          <code className="font-mono">{trackingNumber}</code>
        </p>
      )}
      {labelUrl && (
        <a
          href={labelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Etykieta
        </a>
      )}

      {!editing ? (
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={requestLabel}
            disabled={busy || status === "CANCELLED"}
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Truck className="h-3 w-3" />
            )}
            {labelStatus ? "Powtórz" : "Wygeneruj etykietę"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
          >
            Wpisz nr listu
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5 rounded-lg border border-border bg-background p-2">
          <input
            placeholder="Numer listu przewozowego"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
          />
          <input
            placeholder="URL etykiety (PDF)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="sm" onClick={saveTracking} disabled={busy}>
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              Zapisz
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}
      {carrier && (
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {carrier}
        </p>
      )}
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
