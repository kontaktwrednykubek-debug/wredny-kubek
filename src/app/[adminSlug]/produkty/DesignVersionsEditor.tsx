"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, Upload, X } from "lucide-react";

/** Wersja graficzna produktu (np. ten sam kubek z innym nadrukiem). */
export type DesignVersion = {
  id: string;
  name: string;
  /** Zdjęcie profilowe — miniaturka do wyboru i pierwsze zdjęcie galerii. */
  imageUrl: string;
  /** Zdjęcia dodatkowe — pokazywane w galerii po wybraniu wersji. */
  images: string[];
};

// Profilowe + dodatkowe razem nie mogą przekroczyć limitu galerii produktu.
const MAX_EXTRA_IMAGES = 9;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/shop-products/upload", { method: "POST", body: fd });
  if (!res.ok) return null;
  const { url } = await res.json();
  return url ?? null;
}

export function DesignVersionsEditor({
  versions,
  onChange,
}: {
  versions: DesignVersion[];
  onChange: (next: DesignVersion[]) => void;
}) {
  function update(id: string, patch: Partial<DesignVersion>) {
    onChange(versions.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  function remove(id: string) {
    const v = versions.find((x) => x.id === id);
    if (!confirm(`Usunąć wersję „${v?.name || "bez nazwy"}"?`)) return;
    onChange(versions.filter((x) => x.id !== id));
  }
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= versions.length) return;
    const next = [...versions];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }
  function add() {
    onChange([
      ...versions,
      { id: newId(), name: `Wersja ${versions.length + 1}`, imageUrl: "", images: [] },
    ]);
  }

  return (
    <div className="space-y-3">
      {versions.map((v, idx) => (
        <VersionCard
          key={v.id}
          version={v}
          index={idx}
          total={versions.length}
          onChange={(patch) => update(v.id, patch)}
          onRemove={() => remove(v.id)}
          onMove={(dir) => move(idx, dir)}
        />
      ))}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Dodaj wersję
      </button>
    </div>
  );
}

function VersionCard({
  version,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  version: DesignVersion;
  index: number;
  total: number;
  onChange: (patch: Partial<DesignVersion>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [uploadingMain, setUploadingMain] = React.useState(false);
  const [uploadingExtra, setUploadingExtra] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onMainUpload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploadingMain(true);
    try {
      const url = await uploadFile(files[0]);
      if (!url) { setError("Błąd uploadu zdjęcia."); return; }
      onChange({ imageUrl: url });
    } finally {
      setUploadingMain(false);
    }
  }

  async function onExtraUpload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const free = MAX_EXTRA_IMAGES - version.images.length;
    if (files.length > free) {
      setError(`Maksymalnie ${MAX_EXTRA_IMAGES} zdjęć dodatkowych na wersję.`);
      return;
    }
    setUploadingExtra(true);
    try {
      const added: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadFile(f);
        if (!url) { setError("Błąd uploadu zdjęcia."); break; }
        added.push(url);
      }
      if (added.length) onChange({ images: [...version.images, ...added] });
    } finally {
      setUploadingExtra(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
          {index + 1}
        </span>
        <input
          value={version.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Nazwa wersji (np. Wersja 1, Wersja z kotem)"
          maxLength={80}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded p-1 hover:bg-muted disabled:opacity-30" aria-label="W górę">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded p-1 hover:bg-muted disabled:opacity-30" aria-label="W dół">
          <ChevronDown className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRemove} className="rounded p-1 text-destructive hover:bg-destructive/10" aria-label="Usuń wersję">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Zdjęcie profilowe */}
        <div className="shrink-0">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Zdjęcie profilowe <span className="text-destructive">*</span>
          </p>
          <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition hover:border-primary">
            {version.imageUrl ? (
              <Image src={version.imageUrl} alt={version.name} fill className="object-cover" unoptimized />
            ) : (
              <span className="px-2 text-center text-xs text-muted-foreground">Dodaj zdjęcie</span>
            )}
            <span className={`absolute inset-0 flex items-center justify-center bg-black/40 transition ${
              uploadingMain ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              {uploadingMain ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Upload className="h-6 w-6 text-white" />
              )}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { void onMainUpload(e.target.files); e.target.value = ""; }}
            />
          </label>
        </div>

        {/* Zdjęcia dodatkowe */}
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Zdjęcia dodatkowe ({version.images.length}/{MAX_EXTRA_IMAGES})
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {version.images.map((src, i) => (
              <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                <Image src={src} alt="" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => onChange({ images: version.images.filter((_, j) => j !== i) })}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Usuń zdjęcie"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {version.images.length < MAX_EXTRA_IMAGES && (
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-foreground">
                {uploadingExtra ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { void onExtraUpload(e.target.files); e.target.value = ""; }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
