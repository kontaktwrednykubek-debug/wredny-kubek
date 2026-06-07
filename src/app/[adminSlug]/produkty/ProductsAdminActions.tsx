"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2, Sparkles } from "lucide-react";

export function ReindexButton() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = React.useState("");

  async function run() {
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/admin/reindex-embeddings", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMsg(data.error ?? "Błąd");
      } else {
        setStatus("done");
        setMsg(`Zaktualizowano: ${data.updated}/${data.total}${data.errors?.length ? ` | Błędy: ${data.errors.join(", ")}` : ""}`);
      }
    } catch (e) {
      setStatus("error");
      setMsg(String(e));
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={status === "loading"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#40C4A4]/60 bg-[#40C4A4]/10 px-3 py-1.5 text-xs font-semibold text-[#40C4A4] hover:bg-[#40C4A4]/20 disabled:opacity-50 transition-all"
      >
        <Sparkles className={`h-3.5 w-3.5 ${status === "loading" ? "animate-spin" : ""}`} />
        {status === "loading" ? "Generuję embeddingi…" : "Reindeksuj AI (embeddingi)"}
      </button>
      {msg && (
        <p className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

export function ProductsAdminActions({
  slug,
  adminSlug,
  isFeatured,
}: {
  slug: string;
  adminSlug: string;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [featured, setFeatured] = React.useState(isFeatured);
  const [featuredPending, setFeaturedPending] = React.useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Usunąć ten produkt? Zdjęcia pozostaną w storage.")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/shop-products/${slug}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onToggleFeatured(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFeaturedPending(true);
    try {
      const next = !featured;
      const res = await fetch(`/api/admin/products/${slug}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Błąd");
        return;
      }
      setFeatured(next);
      router.refresh();
    } finally {
      setFeaturedPending(false);
    }
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Link
          href={`/${adminSlug}/produkty/${slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Pencil className="h-3 w-3" />
          Edytuj
        </Link>
        <button
          onClick={onToggleFeatured}
          disabled={featuredPending}
          title={featured ? "Usuń z polecanych" : "Dodaj do polecanych (max 15)"}
          className={`inline-flex items-center gap-1 text-xs transition disabled:opacity-50 ${
            featured
              ? "text-amber-500 hover:text-amber-400"
              : "text-muted-foreground hover:text-amber-500"
          }`}
        >
          <Star
            className={`h-3.5 w-3.5 ${featured ? "fill-amber-500" : ""}`}
          />
          {featured ? "Polecane" : "Poleć"}
        </button>
      </div>
      <button
        onClick={onDelete}
        disabled={pending}
        className="inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
        Usuń
      </button>
    </div>
  );
}
