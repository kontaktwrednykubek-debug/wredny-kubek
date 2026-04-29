"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 10;

type Spec = { key: string; value: string };

type Variants = {
  colors?: { name: string; hex: string }[];
  sizes?: string[];
};

export type ProductInitial = {
  slug: string;
  title: string;
  description: string;
  category: string;
  price_grosze: number;
  images: string[];
  specs: Record<string, string>;
  variants: Variants;
  rating: number;
  reviews_count: number;
};

const CONDITIONS = ["Nowy", "Używany"] as const;
const QUANTITIES = Array.from({ length: 30 }, (_, i) => String(i + 1));

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function ProductForm({
  adminSlug,
  initial,
  mode = "create",
}: {
  adminSlug: string;
  initial?: ProductInitial;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(isEdit);
  const [description, setDescription] = React.useState(
    initial?.description ?? "",
  );
  const [category, setCategory] = React.useState(initial?.category ?? "merch");
  const [priceZl, setPriceZl] = React.useState(
    initial ? (initial.price_grosze / 100).toFixed(2) : "",
  );
  const [rating, setRating] = React.useState(initial?.rating ?? 0);
  const [reviewsCount, setReviewsCount] = React.useState(
    initial ? String(initial.reviews_count) : "",
  );
  const [images, setImages] = React.useState<string[]>(initial?.images ?? []);

  // Wymagane pola wydzielone ze specs:
  const [condition, setCondition] = React.useState<string>(
    initial?.specs?.["Stan"] ?? "Nowy",
  );
  const [quantity, setQuantity] = React.useState<string>(
    initial?.specs?.["Ilość"] ?? "1",
  );

  // Pozostałe specs (bez Stan/Ilość)
  const [specs, setSpecs] = React.useState<Spec[]>(() => {
    if (initial?.specs) {
      const rest = Object.entries(initial.specs).filter(
        ([k]) => k !== "Stan" && k !== "Ilość",
      );
      return rest.length > 0
        ? rest.map(([key, value]) => ({ key, value }))
        : [{ key: "Pojemność", value: "" }];
    }
    return [
      { key: "Pojemność", value: "" },
      { key: "Materiał", value: "" },
    ];
  });

  // Warianty
  const [hasColors, setHasColors] = React.useState(
    Boolean(initial?.variants?.colors?.length),
  );
  const [colors, setColors] = React.useState<{ name: string; hex: string }[]>(
    initial?.variants?.colors ?? [{ name: "Czarny", hex: "#000000" }],
  );
  const [hasSizes, setHasSizes] = React.useState(
    Boolean(initial?.variants?.sizes?.length),
  );
  const [sizesText, setSizesText] = React.useState(
    initial?.variants?.sizes?.join(", ") ?? "S, M, L, XL",
  );

  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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
    if (!CONDITIONS.includes(condition as (typeof CONDITIONS)[number])) {
      setError("Pole 'Stan' jest wymagane.");
      return;
    }
    const qInt = parseInt(quantity, 10);
    if (!Number.isFinite(qInt) || qInt < 1 || qInt > 30) {
      setError("Pole 'Ilość' musi być liczbą 1–30.");
      return;
    }
    const priceGr = Math.round(parseFloat(priceZl.replace(",", ".")) * 100);
    if (!Number.isFinite(priceGr) || priceGr < 0) {
      setError("Nieprawidłowa cena.");
      return;
    }
    const specsObj: Record<string, string> = {
      Stan: condition,
      Ilość: String(qInt),
    };
    for (const s of specs) {
      const k = s.key.trim();
      if (k && k !== "Stan" && k !== "Ilość") {
        specsObj[k] = s.value.trim();
      }
    }
    const variants: Variants = {};
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

    const payload = {
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
    };

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/shop-products/${initial!.slug}`
        : "/api/shop-products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Nie udało się zapisać produktu");
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

      {/* Warianty */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Warianty (opcjonalne)
        </legend>
        <p className="text-xs text-muted-foreground">
          Zaznacz, co ma być widoczne na stronie produktu jako wybór dla klienta.
        </p>

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
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Dane techniczne
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stan" required>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={inputCls}
              required
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ilość" required>
            <select
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputCls}
              required
            >
              {QUANTITIES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-3 border-t border-border/50 pt-4">
          <p className="text-xs text-muted-foreground">
            Dodatkowe parametry techniczne (opcjonalne).
          </p>
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
        </div>
      </fieldset>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting || uploading} size="lg">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Zapisz zmiany" : "Dodaj produkt"}
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
