"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const options = [
  { value: "PENDING", label: "Oczekujące" },
  { value: "PAID", label: "Opłacone" },
  { value: "IN_PRODUCTION", label: "W produkcji" },
  { value: "SHIPPED", label: "Wysłane" },
  { value: "DELIVERED", label: "Dostarczone" },
  { value: "CANCELLED", label: "Anulowane" },
] as const;

const colors: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PAID: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  IN_PRODUCTION: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  SHIPPED: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export function OrderStatusSelect({
  id,
  ids,
  status,
}: {
  id: string;
  ids?: string[];
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(status);
  const [pending, setPending] = React.useState(false);
  const allIds = ids && ids.length > 0 ? ids : [id];

  async function updateStatus(next: string) {
    const prev = value;
    setValue(next);
    setPending(true);
    try {
      const results = await Promise.all(
        allIds.map((oid) =>
          fetch(`/api/admin/orders/${oid}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: next }),
          }),
        ),
      );
      if (results.some((r) => !r.ok)) {
        setValue(prev);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateStatus(e.target.value);
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {value === "PENDING" && (
        <button
          onClick={() => updateStatus("PAID")}
          disabled={pending}
          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          ✓ Potwierdź płatność
        </button>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={pending}
        className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium outline-none transition disabled:opacity-60 ${colors[value] ?? "bg-muted"}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-background">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
