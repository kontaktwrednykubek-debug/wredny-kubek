"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = { email: string | null; full_name: string | null };

export function ExportEmailsButton({ rows }: { rows: Row[] }) {
  const [busy, setBusy] = React.useState(false);

  function handleExport() {
    setBusy(true);
    try {
      const header = ["imie", "email"];
      const lines = rows
        .filter((r) => r.email)
        .map((r) => {
          const firstName = (r.full_name ?? "").trim().split(/\s+/)[0] ?? "";
          return [csvEscape(firstName), csvEscape(r.email!)].join(",");
        });
      const csv = "\uFEFF" + [header.join(","), ...lines].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `uzytkownicy-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={handleExport} disabled={busy} variant="outline" size="sm">
      <Download className="h-4 w-4" />
      Eksport CSV (imię + email)
    </Button>
  );
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
