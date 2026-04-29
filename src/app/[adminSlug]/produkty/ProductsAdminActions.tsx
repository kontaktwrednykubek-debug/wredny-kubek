"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ProductsAdminActions({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Usunąć ten produkt? Zdjęcia pozostaną w storage."))
      return;
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
    <button
      onClick={onDelete}
      disabled={pending}
      className="mt-3 inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" />
      Usuń produkt
    </button>
  );
}
