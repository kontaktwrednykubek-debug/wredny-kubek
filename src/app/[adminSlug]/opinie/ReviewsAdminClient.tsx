"use client";

import * as React from "react";
import { Check, X, Trash2, Star, ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Review = {
  id: string;
  product_slug: string;
  author_name: string;
  rating: number;
  body: string;
  image_url: string | null;
  is_approved: boolean;
  created_at: string;
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
        />
      ))}
    </div>
  );
}

export function ReviewsAdminClient({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = React.useState<Review[]>(initialReviews);
  const [filter, setFilter] = React.useState<"all" | "pending" | "approved">("pending");
  const [expandedImage, setExpandedImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});

  const pending = reviews.filter((r) => !r.is_approved);
  const approved = reviews.filter((r) => r.is_approved);
  const filtered =
    filter === "pending" ? pending : filter === "approved" ? approved : reviews;

  async function handleApprove(id: string, approve: boolean) {
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_approved: approve }),
      });
      if (!res.ok) throw new Error();
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: approve } : r))
      );
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Usunąć tę opinię?")) return;
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "all"] as const).map((f) => {
          const label =
            f === "pending"
              ? `Oczekujące (${pending.length})`
              : f === "approved"
                ? `Zatwierdzone (${approved.length})`
                : `Wszystkie (${reviews.length})`;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
                filter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
          {filter === "pending" ? "Brak opinii oczekujących na zatwierdzenie ✅" : "Brak opinii."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={`rounded-xl border bg-card p-4 flex flex-col gap-3 ${
                review.is_approved ? "border-green-200 dark:border-green-900" : "border-border"
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {review.author_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm">{review.author_name}</span>
                    {review.is_approved ? (
                      <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs px-2 py-0.5 font-medium">
                        Zatwierdzona
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-xs px-2 py-0.5 font-medium">
                        Oczekuje
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-9">
                    <StarDisplay rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pl-PL")}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {review.product_slug}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!review.is_approved ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading[review.id]}
                      onClick={() => handleApprove(review.id, true)}
                      className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
                    >
                      <Check size={13} />
                      Zatwierdź
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading[review.id]}
                      onClick={() => handleApprove(review.id, false)}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                    >
                      <X size={13} />
                      Cofnij
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading[review.id]}
                    onClick={() => handleDelete(review.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line pl-9">
                {review.body}
              </p>

              {/* Image */}
              {review.image_url && (
                <div className="pl-9">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedImage(
                        expandedImage === review.id ? null : review.id
                      )
                    }
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ImageIcon size={12} />
                    Zdjęcie
                    {expandedImage === review.id ? (
                      <ChevronUp size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                  </button>
                  {expandedImage === review.id && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border max-w-xs">
                      <Image
                        src={review.image_url}
                        alt="Zdjęcie opinii"
                        width={400}
                        height={300}
                        className="w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
