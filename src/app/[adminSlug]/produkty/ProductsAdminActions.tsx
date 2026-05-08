"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";

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
