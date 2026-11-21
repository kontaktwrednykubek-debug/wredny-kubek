"use client";

import * as React from "react";
import { Star, X, ImagePlus, Loader2, LogIn, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

// ─── types ────────────────────────────────────────────────────────────────────

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  image_url: string | null;
  created_at: string;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

export function StarRow({
  value,
  interactive = false,
  size = 16,
  onChange,
}: {
  value: number;
  interactive?: boolean;
  size?: number;
  onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = React.useState(0);
  const display = interactive ? (hovered || value) : value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={[
            n <= display ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
            interactive ? "cursor-pointer transition-colors" : "",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {review.author_name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm">{review.author_name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <StarRow value={review.rating} size={14} />
      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
        {review.body}
      </p>
      {review.image_url && (
        <div className="mt-1 rounded-lg overflow-hidden border border-border">
          <Image
            src={review.image_url}
            alt="Zdjęcie do opinii"
            width={500}
            height={300}
            className="w-full object-cover max-h-56"
          />
        </div>
      )}
    </div>
  );
}

// ─── AddReviewForm ─────────────────────────────────────────────────────────────

function AddReviewForm({
  onSuccess,
}: {
  onSuccess: (review: Review) => void;
}) {
  const [rating, setRating] = React.useState(0);
  const [body, setBody] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const supabase = createSupabaseBrowserClient();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Wybierz ocenę (1–5 gwiazdek)");
      return;
    }
    if (body.trim().length < 10) {
      setError("Opinia musi mieć co najmniej 10 znaków");
      return;
    }

    setLoading(true);

    try {
      let image_url: string | null = null;

      if (imageFile) {
        const { data: { user } } = await supabase.auth.getUser();
        const ext = imageFile.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("review-images")
          .upload(path, imageFile, { upsert: true });

        if (uploadError) throw new Error("Błąd przesyłania zdjęcia: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("review-images")
          .getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          review_body: body.trim(),
          image_url,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Błąd zapisu");

      onSuccess(json.review);
      setRating(0);
      setBody("");
      setImageFile(null);
      setImagePreview(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-white dark:bg-zinc-800 p-4 shadow-sm">
      <h3 className="font-semibold text-sm text-foreground">Twoja opinia</h3>

      {/* Star rating */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-foreground">Ocena *</span>
        <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 px-3 py-2.5">
          <StarRow value={rating} interactive size={26} onChange={setRating} />
        </div>
      </div>

      {/* Review text */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-foreground">Opinia *</span>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Napisz, co sądzisz o naszych kubkach... (min. 10 znaków)"
          rows={4}
          className="resize-none text-sm bg-white dark:bg-zinc-900 border border-border rounded-lg focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-foreground">Zdjęcie (opcjonalne)</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        {imagePreview ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <Image src={imagePreview} alt="Podgląd" width={400} height={240} className="w-full object-cover max-h-48" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-lg px-3 py-3 w-full justify-center bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            <ImagePlus size={15} />
            Kliknij aby dodać zdjęcie
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Opublikuj opinię
      </Button>
    </form>
  );
}

// ─── ReviewsClient (strona /opinie) ───────────────────────────────────────────

export function ReviewsClient({ reviews }: { reviews: Review[] }) {
  const [user, setUser] = React.useState<{ id: string } | null | undefined>(undefined);
  const [showForm, setShowForm] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const supabase = createSupabaseBrowserClient();

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* CTA: dodaj opinię */}
      {submitted ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center dark:border-green-900 dark:bg-green-950/30">
          <p className="text-sm font-medium text-green-800 dark:text-green-400">✅ Dziękujemy za opinię!</p>
          <p className="mt-1 text-xs text-green-700 dark:text-green-500">
            Twoja opinia oczekuje na zatwierdzenie przez administratora. Pojawi się wkrótce.
          </p>
        </div>
      ) : showForm ? (
        <AddReviewForm
          onSuccess={() => {
            setSubmitted(true);
            setShowForm(false);
          }}
        />
      ) : user === null ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Aby dodać opinię, musisz być zalogowany.</p>
          <Link href="/login?next=/opinie">
            <Button>
              <LogIn size={16} className="mr-1.5" />
              Zaloguj się i dodaj opinię
            </Button>
          </Link>
        </div>
      ) : (
        <Button size="lg" className="w-full sm:w-auto sm:self-start" onClick={() => setShowForm(true)} disabled={user === undefined}>
          <MessageSquarePlus size={16} className="mr-1.5" />
          Dodaj swoją opinię
        </Button>
      )}

      {/* Lista opinii */}
      {reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Brak opinii. Bądź pierwszy! ✍️</p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
