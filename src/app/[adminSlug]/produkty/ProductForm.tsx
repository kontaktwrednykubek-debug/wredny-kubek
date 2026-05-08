"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 10;

type Spec = { key: string; value: string };

type CupColorVariant = {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  stock_count: number;
};

type Variants = {
  colors?: { name: string; hex: string }[];
  cupColors?: { id: string; name: string; imageUrl: string }[];
  capacities?: string[];
  sizes?: string[];
};

export type ProductInitial = {
  slug: string;
  title: string;
  description: string;
  body: string;
  category: string;
  price_grosze: number;
  images: string[];
  specs: Record<string, string>;
  variants: Variants;
  rating: number;
  reviews_count: number;
  show_variant_stock: boolean;
  variant_stock: Record<string, number>;
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
  const [body, setBody] = React.useState(initial?.body ?? "");
  const [showVariantStock, setShowVariantStock] = React.useState(
    initial?.show_variant_stock ?? false,
  );
  const [variantStock, setVariantStock] = React.useState<Record<string, number>>(
    initial?.variant_stock ?? {},
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

  // Warianty — pojemności
  const [capacities, setCapacities] = React.useState<string[]>(
    initial?.variants?.capacities ?? [],
  );
  const [capInput, setCapInput] = React.useState("");

  // Warianty — kolory kubków (ID z globalnych wariantów)
  const [selectedCupColorIds, setSelectedCupColorIds] = React.useState<string[]>(
    initial?.variants?.cupColors?.map((c) => c.id) ?? [],
  );
  const [cupColorVariants, setCupColorVariants] = React.useState<CupColorVariant[]>([]);

  React.useEffect(() => {
    void fetch("/api/cup-variants")
      .then((r) => r.json())
      .then((j) => setCupColorVariants(j.variants ?? []))
      .catch(() => setCupColorVariants([]));
  }, []);

  function toggleCupColor(id: string) {
    // Nie pozwalaj zaznaczyć wariantu, który ma 0 sztuk globalnie
    const variant = cupColorVariants.find((v) => v.id === id);
    if (variant && variant.stock_count === 0 && !selectedCupColorIds.includes(id)) {
      return;
    }
    setSelectedCupColorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addCapacity() {
    const v = capInput.trim();
    if (!v || capacities.includes(v)) return;
    setCapacities((prev) => [...prev, v]);
    setCapInput("");
  }

  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Kategorie z bazy
  const [categories, setCategories] = React.useState<
    { id: string; slug: string; name: string; parent_id: string | null; sort_order: number }[]
  >([]);

  React.useEffect(() => {
    void fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

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
    if (capacities.length > 0) variants.capacities = capacities;
    if (selectedCupColorIds.length > 0) {
      variants.cupColors = cupColorVariants
        .filter((v) => selectedCupColorIds.includes(v.id))
        .map((v) => ({ id: v.id, name: v.name, imageUrl: v.image_url ?? "" }));
    }

    const payload = {
      slug,
      title,
      description,
      body,
      showVariantStock,
      variantStock,
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
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
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
            <option value="">— wybierz —</option>
            {categories
              .filter((c) => c.parent_id === null)
              .map((parent) => {
                const children = categories.filter(
                  (c) => c.parent_id === parent.id,
                );
                return (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.slug}>
                      {parent.name} (główna)
                    </option>
                    {children.map((child) => (
                      <option key={child.id} value={child.slug}>
                        — {child.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
          </select>
        </Field>
        <Field label="Krótki opis">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="Krótki opis widoczny obok ceny..."
          />
        </Field>
        <Field
          label="Długi opis (pod zdjęciami)"
          hint="Pełny opis produktu wyświetlany pod galerią zdjęć na stronie produktu."
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className={inputCls}
            placeholder="Szczegółowy opis produktu, historia, zastosowanie, pielęgnacja..."
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
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
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
      <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Warianty (opcjonalne)
        </legend>

        {/* Pojemność kubka */}
        <div className="space-y-3 rounded-xl border border-border/60 p-4">
          <p className="text-sm font-medium">Pojemność kubka</p>
          <p className="text-xs text-muted-foreground">
            Wpisz pojemność (np. 330 ml) i kliknij „+" lub Enter. Na stronie
            produktu klient będzie mógł wybrać jedną opcję.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCapacity(); } }}
              placeholder="np. 330 ml"
              className={`${inputCls} flex-1`}
            />
            <Button type="button" variant="outline" size="sm" onClick={addCapacity}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {capacities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {capacities.map((cap) => (
                <span
                  key={cap}
                  className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
                >
                  {cap}
                  <button
                    type="button"
                    onClick={() => setCapacities((prev) => prev.filter((c) => c !== cap))}
                    className="ml-0.5 rounded-full hover:bg-primary/20"
                    aria-label="Usuń"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Kolory kubka */}
        <div className="space-y-3 rounded-xl border border-border/60 p-4">
          <p className="text-sm font-medium">Kolory kubka</p>
          <p className="text-xs text-muted-foreground">
            Zaznacz kolory dostępne dla tego produktu. Zarządzaj kolorami w zakładce{" "}
            <strong>Warianty</strong>. Na stronie klient wybierze jeden kolor.
          </p>
          {cupColorVariants.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Brak zdefiniowanych kolorów. Dodaj je w panelu → Warianty.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {cupColorVariants.map((v) => {
                const selected = selectedCupColorIds.includes(v.id);
                const outOfStock = v.stock_count === 0;
                const disabled = outOfStock && !selected;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleCupColor(v.id)}
                    title={outOfStock ? "Brak na stanie globalnym — dodaj sztuki w zakładce Warianty" : undefined}
                    className={`relative overflow-hidden rounded-xl border-2 transition ${
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : disabled
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="relative aspect-square bg-muted">
                      {v.image_url ? (
                        <Image
                          src={v.image_url}
                          alt={v.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          Brak zdjęcia
                        </div>
                      )}
                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <div className="rounded-full bg-primary p-1">
                            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="px-2 py-1.5 text-center text-xs font-medium">
                      {v.name}
                      {outOfStock && (
                        <span className="ml-1 text-[10px] text-destructive font-semibold">— brak ({v.stock_count})</span>
                      )}
                      {!outOfStock && (
                        <span className="ml-1 text-[10px] text-muted-foreground">({v.stock_count})</span>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ilość na stanie per kolor */}
        {selectedCupColorIds.length > 0 && (
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-primary">
                📦 Stan magazynowy dla każdego koloru
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Wpisz ile sztuk masz dostępnych w każdym kolorze. Klient nie
                będzie mógł zamówić więcej niż wpisana liczba.
              </p>
            </div>
            <div className="space-y-2">
              {cupColorVariants
                .filter((v) => selectedCupColorIds.includes(v.id))
                .map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                  >
                    {v.image_url ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={v.image_url}
                          alt={v.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
                    )}
                    <span className="flex-1 text-sm font-medium">{v.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={v.stock_count}
                        value={variantStock[v.id] ?? ""}
                        placeholder="0"
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          const safe = isNaN(n) ? 0 : Math.max(0, Math.min(v.stock_count, n));
                          setVariantStock((prev) => ({
                            ...prev,
                            [v.id]: safe,
                          }));
                        }}
                        className="w-24 rounded-lg border-2 border-input bg-background px-3 py-1.5 text-sm font-semibold focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs text-muted-foreground">
                        / {v.stock_count} szt.
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Checkbox: pokaż stan na stronie klienta */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4 hover:bg-muted/30">
          <input
            type="checkbox"
            checked={showVariantStock}
            onChange={(e) => setShowVariantStock(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div>
            <p className="text-sm font-medium">Pokaż dostępność kolorów klientom</p>
            <p className="text-xs text-muted-foreground">
              Jeśli włączone, klient zobaczy ile sztuk danego koloru pozostało na
              stanie. Stan ustawiasz w zakładce <strong>Warianty</strong>.
            </p>
          </div>
        </label>
      </fieldset>

      {/* Dane techniczne */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
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

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:relative sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <Button
          type="submit"
          disabled={submitting || uploading}
          size="lg"
          className="w-full sm:w-auto"
        >
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
