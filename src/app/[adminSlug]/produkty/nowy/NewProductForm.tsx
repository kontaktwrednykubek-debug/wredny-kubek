"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 10;

type Spec = { key: string; value: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function NewProductForm({ adminSlug }: { adminSlug: string }) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("merch");
  const [priceZl, setPriceZl] = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [reviewsCount, setReviewsCount] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [specs, setSpecs] = React.useState<Spec[]>([
    { key: "Pojemność", value: "" },
    { key: "Materiał", value: "" },
  ]);

  // Warianty (opcjonalne) — admin sam zaznacza, co ma być widoczne.
  const [hasColors, setHasColors] = React.useState(false);
  const [colors, setColors] = React.useState<{ name: string; hex: string }[]>([
    { name: "Czarny", hex: "#000000" },
  ]);
  const [hasSizes, setHasSizes] = React.useState(false);
  const [sizesText, setSizesText] = React.useState("S, M, L, XL");
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Auto-slug z tytułu, póki user ręcznie nie dotknął.
  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maksymalnie ${MAX_IMAGES} zdjęć.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/shop-products/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? "Błąd uploadu");
          break;
        }
        const { url } = await res.json();
        setImages((prev) => [...prev, url]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSpec(idx: number, patch: Partial<Spec>) {
    setSpecs((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }
  function addSpec() {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  }
  function removeSpec(idx: number) {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !slug.trim()) {
      setError("Tytuł i slug są wymagane.");
      return;
    }
    const priceGr = Math.round(parseFloat(priceZl.replace(",", ".")) * 100);
    if (!Number.isFinite(priceGr) || priceGr < 0) {
      setError("Nieprawidłowa cena.");
      return;
    }
    const specsObj: Record<string, string> = {};
    for (const s of specs) {
      if (s.key.trim()) specsObj[s.key.trim()] = s.value.trim();
    }
    const variants: {
      colors?: { name: string; hex: string }[];
      sizes?: string[];
    } = {};
    if (hasColors && colors.length > 0) {
      variants.colors = colors.filter((c) => c.name.trim() && c.hex);
    }
    if (hasSizes) {
      const arr = sizesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length > 0) variants.sizes = arr;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/shop-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description,
          category,
          priceGrosze: priceGr,
          images,
          specs: specsObj,
          variants,
          rating,
          reviewsCount: parseInt(reviewsCount || "0", 10) || 0,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Nie udało się utworzyć produktu");
        return;
      }
      router.push(`/${adminSlug}/produkty`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Podstawowe */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Podstawowe
        </legend>
        <Field label="Tytuł" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            placeholder="Np. Kubek ceramiczny 330 ml"
            required
          />
        </Field>
        <Field
          label="Slug (URL)"
          hint="Używany w linku /sklep/<slug>. Małe litery, cyfry, myślniki."
        >
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={inputCls}
            pattern="[a-z0-9\-]+"
            required
          />
        </Field>
        <Field label="Kategoria">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
          >
            <option value="merch">Merch (z grafiką)</option>
            <option value="kubek">Kubek</option>
            <option value="koszulka">Koszulka</option>
            <option value="bluza">Bluza</option>
            <option value="torba">Torba</option>
            <option value="gadzet">Gadżet</option>
          </select>
        </Field>
        <Field label="Opis">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Krótki opis produktu, materiały, przeznaczenie..."
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cena (PLN)" required>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceZl}
              onChange={(e) => setPriceZl(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Liczba opinii">
            <input
              type="number"
              min="0"
              value={reviewsCount}
              onChange={(e) => setReviewsCount(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Ocena (gwiazdki)">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? 0 : n)}
                className="rounded p-1 transition hover:bg-muted"
                aria-label={`${n} gwiazdek`}
              >
                <Star
                  className={`h-6 w-6 ${
                    n <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating > 0 ? `${rating}/5` : "brak"}
            </span>
          </div>
        </Field>
      </fieldset>

      {/* Zdjęcia */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Zdjęcia ({images.length}/{MAX_IMAGES})
        </legend>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              <Image
                src={url}
                alt={`zdjęcie ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                aria-label="Usuń"
              >
                <X className="h-4 w-4" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  okładka
                </span>
              )}
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
              <span>{uploading ? "Wysyłanie..." : "Dodaj zdjęcie"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={uploading}
                onChange={(e) => onUpload(e.target.files)}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG / PNG / WebP / GIF, do 5 MB każde. Pierwsze zdjęcie to okładka.
        </p>
      </fieldset>

      {/* Warianty (opcjonalne) */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Warianty (opcjonalne)
        </legend>
        <p className="text-xs text-muted-foreground">
          Zaznacz, co ma być widoczne na stronie produktu jako wybór dla klienta.
        </p>

        {/* Kolory */}
        <div className="space-y-3 rounded-xl border border-border/60 p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={hasColors}
              onChange={(e) => setHasColors(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Pokaż wybór koloru
          </label>
          {hasColors && (
            <div className="space-y-2 pl-6">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) =>
                      setColors((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, hex: e.target.value } : x,
                        ),
                      )
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
                  />
                  <input
                    type="text"
                    placeholder="Nazwa (np. Czarny)"
                    value={c.name}
                    onChange={(e) =>
                      setColors((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                    className={`${inputCls} flex-1`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setColors((prev) => prev.filter((_, j) => j !== i))
                    }
                    aria-label="Usuń kolor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setColors((prev) => [
                    ...prev,
                    { name: "", hex: "#000000" },
                  ])
                }
              >
                <Plus className="h-4 w-4" />
                Dodaj kolor
              </Button>
            </div>
          )}
        </div>

        {/* Rozmiary */}
        <div className="space-y-3 rounded-xl border border-border/60 p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={hasSizes}
              onChange={(e) => setHasSizes(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Pokaż wybór rozmiaru
          </label>
          {hasSizes && (
            <div className="pl-6">
              <input
                type="text"
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                placeholder="S, M, L, XL"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Rozmiary oddzielone przecinkiem.
              </p>
            </div>
          )}
        </div>
      </fieldset>

      {/* Dane techniczne */}
      <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Dane techniczne
        </legend>
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input
              placeholder="Nazwa parametru"
              value={s.key}
              onChange={(e) => updateSpec(i, { key: e.target.value })}
              className={`${inputCls} flex-1`}
            />
            <input
              placeholder="Wartość"
              value={s.value}
              onChange={(e) => updateSpec(i, { value: e.target.value })}
              className={`${inputCls} flex-1`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSpec(i)}
              aria-label="Usuń parametr"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addSpec}>
          <Plus className="h-4 w-4" />
          Dodaj parametr
        </Button>
      </fieldset>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting || uploading} size="lg">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Dodaj produkt
        </Button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}
