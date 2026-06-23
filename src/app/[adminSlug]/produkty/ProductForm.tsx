"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 10;

// Stałe opcje pojemności kubka pokazywane jako klikalne przyciski.
const CAPACITY_OPTIONS = ["330 ml", "450 ml"];

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
  cupColors?: { id: string; name: string; imageUrl: string; priceGrosze?: number | null }[];
  capacities?: string[];
  sizes?: string[];
};

export type ProductInitial = {
  slug: string;
  title: string;
  description: string;
  body: string;
  category: string;
  categories?: string[];
  price_grosze: number;
  images: string[];
  specs: Record<string, string>;
  variants: Variants;
  rating: number;
  reviews_count: number;
  show_variant_stock: boolean;
  variant_stock: Record<string, number>;
  show_view_counter?: boolean;
  view_count_base?: number;
  view_count_period?: number;
  related_product_ids?: string[];
  tags?: string[];
  labels?: string[];
};

const BADGE_OPTIONS = [
  { value: "bestseller", emoji: "🔥", label: "Bestseller", desc: "Lider sprzedaży — najchętniej kupowany" },
  { value: "najczesciej-kupowany", emoji: "😂", label: "Najczęściej kupowany", desc: "Ranking zamówień w kategorii" },
  { value: "idealny-na-prezent", emoji: "🎁", label: "Idealny na prezent", desc: "Chętnie wybierany jako upominek" },
  { value: "wysylka-jutro", emoji: "⚡", label: "Wysyłka jutro", desc: "Gotowy do wysyłki następnego dnia" },
] as const;

const CONDITIONS = ["Nowy", "Używany"] as const;
// 0–30: 0 = brak na stanie (produkt niedostępny do kupienia).
const QUANTITIES = Array.from({ length: 31 }, (_, i) => String(i));

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
  const [showViewCounter, setShowViewCounter] = React.useState(
    initial?.show_view_counter ?? false,
  );
  const [viewCountBase, setViewCountBase] = React.useState(
    String(initial?.view_count_base ?? 0),
  );
  const [viewCountPeriod, setViewCountPeriod] = React.useState(
    initial?.view_count_period ?? 7,
  );
  const [relatedProductIds, setRelatedProductIds] = React.useState<string[]>(
    initial?.related_product_ids ?? [],
  );
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = React.useState("");
  const [labels, setLabels] = React.useState<string[]>(initial?.labels ?? []);

  function toggleLabel(value: string) {
    setLabels((prev) => prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value]);
  }

  function addTag() {
    const v = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!v || tags.includes(v)) return;
    setTags((prev) => [...prev, v]);
    setTagInput("");
  }
  const [allProducts, setAllProducts] = React.useState<{ id: string; slug: string; title: string }[]>([]);

  React.useEffect(() => {
    fetch("/api/shop-products")
      .then((r) => r.json())
      .then((j) => setAllProducts(j.products ?? []))
      .catch(() => {});
  }, []);
  const [variantStock, setVariantStock] = React.useState<Record<string, number>>(
    initial?.variant_stock ?? {},
  );
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    initial?.categories?.length
      ? initial.categories
      : initial?.category
      ? [initial.category]
      : [],
  );

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }
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

  // Dodatkowe parametry (bez Stan/Ilość). Startują puste — admin dodaje je
  // ręcznie przyciskiem „Dodaj parametr". Żadnych systemowych pól na start.
  const [specs, setSpecs] = React.useState<Spec[]>(() => {
    if (initial?.specs) {
      return Object.entries(initial.specs)
        .filter(([k]) => k !== "Stan" && k !== "Ilość")
        .map(([key, value]) => ({ key, value }));
    }
    return [];
  });

  // Produkt bez wariantów — chowa pojemności/kolory, zostaje sama cena/opis/zdjęcia.
  // Dla edycji: domyślnie włączone, gdy produkt nie ma żadnych wariantów.
  const [noVariants, setNoVariants] = React.useState<boolean>(() => {
    if (!initial) return false;
    const hasCaps = (initial.variants?.capacities?.length ?? 0) > 0;
    const hasColors = (initial.variants?.cupColors?.length ?? 0) > 0;
    return !hasCaps && !hasColors;
  });

  // Warianty — pojemności
  const [capacities, setCapacities] = React.useState<string[]>(
    initial?.variants?.capacities ?? [],
  );

  // Warianty — kolory kubków (ID z globalnych wariantów)
  const [selectedCupColorIds, setSelectedCupColorIds] = React.useState<string[]>(
    initial?.variants?.cupColors?.map((c) => c.id) ?? [],
  );
  // Cena custom per kolor (w zł, jako string). Puste = cena bazowa produktu.
  const [cupColorPrices, setCupColorPrices] = React.useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {};
      initial?.variants?.cupColors?.forEach((c) => {
        if (c.priceGrosze != null) map[c.id] = (c.priceGrosze / 100).toFixed(2);
      });
      return map;
    },
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

  // Stałe opcje pojemności — klikasz, by zaznaczyć/odznaczyć.
  function toggleCapacity(v: string) {
    setCapacities((prev) =>
      prev.includes(v) ? prev.filter((c) => c !== v) : [...prev, v],
    );
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
    if (!Number.isFinite(qInt) || qInt < 0 || qInt > 30) {
      setError("Pole 'Ilość' musi być liczbą 0–30.");
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
      const v = s.value.trim();
      // Zapisuj tylko parametry z nazwą I wartością — puste pomijamy.
      if (k && v && k !== "Stan" && k !== "Ilość") {
        specsObj[k] = v;
      }
    }
    const variants: Variants = {};
    if (!noVariants && capacities.length > 0) variants.capacities = capacities;
    if (!noVariants && selectedCupColorIds.length > 0) {
      variants.cupColors = cupColorVariants
        .filter((v) => selectedCupColorIds.includes(v.id))
        .map((v) => {
          const raw = cupColorPrices[v.id]?.replace(",", ".").trim();
          const parsed = raw ? parseFloat(raw) : NaN;
          const priceGrosze = !isNaN(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
          return { id: v.id, name: v.name, imageUrl: v.image_url ?? "", priceGrosze };
        });
    }
    // Bez wariantów: nie wysyłaj stanu magazynowego per-kolor.
    const variantStockToSend = noVariants ? {} : variantStock;

    const payload = {
      slug,
      title,
      description,
      body,
      showVariantStock: noVariants ? false : showVariantStock,
      variantStock: variantStockToSend,
      categories: selectedCategories,
      category: selectedCategories[0] ?? "",
      priceGrosze: priceGr,
      images,
      specs: specsObj,
      variants,
      rating,
      reviewsCount: parseInt(reviewsCount || "0", 10) || 0,
      showViewCounter,
      viewCountBase: parseInt(viewCountBase || "0", 10) || 0,
      viewCountPeriod,
      relatedProductIds,
      tags,
      labels,
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
      {/* 1. Zdjęcia — na samej górze */}
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

      {/* Podstawowe */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Podstawowe
        </legend>
        {/* 2. Tytuł */}
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
        {/* 3. Krótki opis */}
        <Field label="Krótki opis">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="Krótki opis widoczny obok ceny..."
          />
        </Field>
        {/* 4. Długi opis */}
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
        <Field label="Kategorie" hint="Zaznacz jedną lub więcej kategorii. Pierwsza zaznaczona to kategoria główna.">
          {(() => {
            const parents = categories.filter((c) => !c.parent_id);
            const childrenOf = (parentId: string) =>
              categories.filter((c) => c.parent_id === parentId);
            return (
              <div className="mt-1 space-y-2">
                {parents.map((parent) => {
                  const children = childrenOf(parent.id);
                  const parentChecked = selectedCategories.includes(parent.slug);
                  const isFirst = selectedCategories[0] === parent.slug;
                  return (
                    <div key={parent.id}>
                      {/* Rodzic */}
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition ${
                          parentChecked
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={parentChecked}
                          onChange={() => toggleCategory(parent.slug)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="flex-1 truncate">{parent.name}</span>
                        {isFirst && parentChecked && (
                          <span className="shrink-0 rounded bg-primary px-1 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
                            główna
                          </span>
                        )}
                      </label>
                      {/* Dzieci — zawsze widoczne jako wcięty wiersz */}
                      {children.length > 0 && (
                        <div className="ml-5 mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
                          {children.map((child) => {
                            const childChecked = selectedCategories.includes(child.slug);
                            const isFirstChild = selectedCategories[0] === child.slug;
                            return (
                              <label
                                key={child.id}
                                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-sm transition ${
                                  childChecked
                                    ? "border-primary bg-primary/5 font-medium"
                                    : "border-border/60 hover:border-primary/40"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={childChecked}
                                  onChange={() => toggleCategory(child.slug)}
                                  className="h-3.5 w-3.5 accent-primary"
                                />
                                <span className="flex-1 truncate text-xs">{child.name}</span>
                                {isFirstChild && childChecked && (
                                  <span className="shrink-0 rounded bg-primary px-1 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
                                    główna
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {selectedCategories.length === 0 && (
            <p className="mt-1 text-xs text-destructive">Wybierz co najmniej jedną kategorię.</p>
          )}
        </Field>
        {/* Etykiety / Badges */}
        <div className="rounded-2xl border border-border bg-muted/50 p-4 sm:p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Etykieta produktu</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Wyróżnienie widoczne na karcie produktu w sklepie</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BADGE_OPTIONS.map((opt) => {
              const checked = labels.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    checked ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLabel(opt.value)}
                    className="h-4 w-4 accent-primary shrink-0"
                  />
                  <span className="text-xl shrink-0">{opt.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <Field
          label="Tagi SEO / wektoryzacja"
          hint="Słowa kluczowe (okazja, zawody, humor) — pomagają AI lepiej dopasować produkt. Wpisz i naciśnij Enter."
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="np. urodziny, informatyk, sarkastyczny..."
              className={`${inputCls} flex-1`}
            />
            <button type="button" onClick={addTag} className="rounded-xl border border-border bg-muted px-3 py-1.5 text-sm hover:bg-border transition-colors">+</button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  #{tag}
                  <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="ml-0.5 hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          )}
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

      {/* Warianty */}
      <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Warianty (opcjonalne)
        </legend>

        {/* Przełącznik: produkt bez wariantów */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={noVariants}
            onChange={(e) => setNoVariants(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            <span className="block text-sm font-medium">Produkt bez wariantów</span>
            <span className="block text-xs text-muted-foreground">
              Zaznacz, jeśli produkt nie ma pojemności ani kolorów — zostaje sama
              cena, opis, zdjęcia i specyfikacja.
            </span>
          </span>
        </label>

        {!noVariants && (
        <>
        {/* Pojemność kubka */}
        <div className="space-y-3 rounded-xl border border-border/60 p-4">
          <p className="text-sm font-medium">Pojemność kubka</p>
          <p className="text-xs text-muted-foreground">
            Kliknij pojemność, aby ją dodać. Zaznaczone podświetlają się na
            zielono i pojawią się na stronie produktu do wyboru.
          </p>
          <div className="flex flex-wrap gap-2">
            {CAPACITY_OPTIONS.map((cap) => {
              const selected = capacities.includes(cap);
              return (
                <button
                  key={cap}
                  type="button"
                  onClick={() => toggleCapacity(cap)}
                  aria-pressed={selected}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-green-500 bg-green-500/10 text-green-700"
                      : "border-border text-foreground hover:border-green-500/50"
                  }`}
                >
                  {cap}
                </button>
              );
            })}
          </div>
          {/* Zgodność wstecz: pokaż niestandardowe pojemności zapisane wcześniej */}
          {capacities.filter((c) => !CAPACITY_OPTIONS.includes(c)).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {capacities
                .filter((c) => !CAPACITY_OPTIONS.includes(c))
                .map((cap) => (
                  <span
                    key={cap}
                    className="flex items-center gap-1 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1 text-sm font-medium text-green-700"
                  >
                    {cap}
                    <button
                      type="button"
                      onClick={() => setCapacities((prev) => prev.filter((c) => c !== cap))}
                      className="ml-0.5 rounded-full hover:bg-green-500/20"
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
                📦 Stan magazynowy i cena dla każdego koloru
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Stan magazynowy jest wspólny dla całego sklepu — ten sam kolor
                dzieli jedną pulę między wszystkimi produktami. Edytuj go w
                zakładce <span className="font-semibold">Warianty</span>. Cena
                opcjonalna — puste = cena bazowa produktu (np. biały 35 zł,
                różowy 37 zł).
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
                    {/* Stan magazynowy — wspólny globalny (tylko podgląd, edycja w Warianty) */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-lg px-2 py-1.5 text-sm font-semibold ${
                          v.stock_count === 0
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-foreground"
                        }`}
                        title="Wspólny stan magazynowy — edytuj w zakładce Warianty"
                      >
                        {v.stock_count}
                      </span>
                      <span className="text-xs text-muted-foreground">szt. (wspólny)</span>
                    </div>
                    {/* Cena custom */}
                    <div className="flex items-center gap-1.5 border-l border-border pl-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cupColorPrices[v.id] ?? ""}
                        placeholder="bazowa"
                        onChange={(e) =>
                          setCupColorPrices((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        className="w-20 rounded-lg border-2 border-input bg-background px-2 py-1.5 text-sm font-semibold focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs text-muted-foreground">zł</span>
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
        </>
        )}
      </fieldset>

      {/* Licznik popularności */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Licznik popularności
        </legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4 hover:bg-muted/30">
          <input
            type="checkbox"
            checked={showViewCounter}
            onChange={(e) => setShowViewCounter(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div>
            <p className="text-sm font-medium">Włącz licznik popularności 🔥</p>
            <p className="text-xs text-muted-foreground">
              Pod tytułem produktu pojawi się komunikat: &quot;X osób wyświetliło ten kubek w tym tygodniu&quot;.
            </p>
          </div>
        </label>
        {showViewCounter && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Wartość bazowa"
                hint="Liczba dodawana do rzeczywistych wyświetleń — ustaw startowy boost."
              >
                <input
                  type="number"
                  min="0"
                  value={viewCountBase}
                  onChange={(e) => setViewCountBase(e.target.value)}
                  className={inputCls}
                  placeholder="np. 150"
                />
              </Field>
              <Field label="Okno czasowe" hint="Okres, z którego liczone są wyświetlenia.">
                <select
                  value={viewCountPeriod}
                  onChange={(e) => setViewCountPeriod(Number(e.target.value))}
                  className={inputCls}
                >
                  <option value={7}>🔥 Ostatnie 7 dni</option>
                  <option value={30}>👀 Ostatnie 30 dni (miesiąc)</option>
                </select>
              </Field>
            </div>
          </div>
        )}
      </fieldset>

      {/* Powiązane produkty */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Powiązane produkty
        </legend>
        <p className="text-xs text-muted-foreground">
          Zaznacz produkty do wyświetlenia w sekcji &quot;Inne wredne kubki&quot; na stronie tego produktu.
          Jeśli nie zaznaczysz żadnych, system automatycznie dobierze podobne wektorowo.
        </p>
        {allProducts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Ładuję produkty…</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
            {allProducts
              .filter((p) => p.slug !== (initial?.slug ?? ""))
              .map((p) => {
                const checked = relatedProductIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 text-sm transition ${
                      checked
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setRelatedProductIds((prev) =>
                          checked ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                        )
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="flex-1 truncate">{p.title}</span>
                  </label>
                );
              })}
          </div>
        )}
        {relatedProductIds.length > 0 && (
          <p className="text-xs text-primary font-medium">Zaznaczono: {relatedProductIds.length}</p>
        )}
      </fieldset>

      {/* Dane techniczne */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Dane techniczne
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* „Stan" pomijamy przy produkcie bez wariantu (klient go nie widzi). */}
          {!noVariants && (
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
          )}
          <Field label={noVariants ? "Ilość (stan magazynowy)" : "Ilość"} required>
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
