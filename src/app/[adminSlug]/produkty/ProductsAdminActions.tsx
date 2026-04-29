"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

export function ProductsAdminActions({
  slug,
  adminSlug,
}: {
  slug: string;
  adminSlug: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Usunąć ten produkt? Zdjęcia pozostaną w storage.")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/shop-products/${slug}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <Link
        href={`/${adminSlug}/produkty/${slug}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Pencil className="h-3 w-3" />
        Edytuj
      </Link>
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
