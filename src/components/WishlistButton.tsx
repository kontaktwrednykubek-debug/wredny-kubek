"use client";

import * as React from "react";
import { Heart } from "lucide-react";

export function WishlistButton({
  slug,
  initialSaved = false,
  className = "",
}: {
  slug: string;
  initialSaved?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [loading, setLoading] = React.useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (res.status === 401) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    if (res.ok) {
      const json = await res.json();
      setSaved(json.saved);
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow transition hover:scale-110 active:scale-95 disabled:opacity-50 ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${saved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`}
      />
    </button>
  );
}
