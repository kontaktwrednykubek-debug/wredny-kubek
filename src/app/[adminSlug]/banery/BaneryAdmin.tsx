"use client";

import * as React from "react";
import Image from "next/image";
import { Trash2, Upload, ArrowUp, ArrowDown, ExternalLink, ImageIcon } from "lucide-react";

type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export function BaneryAdmin({ adminSlug }: { adminSlug: string }) {
  void adminSlug;
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/banners");
    const data = await res.json();
    setBanners(data.banners ?? []);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, []);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/banners/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Błąd upload"); setPreviewUrl(null); return; }
      setUploadedUrl(data.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onAdd() {
    if (!uploadedUrl) { setError("Najpierw dodaj zdjęcie"); return; }
    setError("");
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || null, image_url: uploadedUrl, link_url: linkUrl || null, sort_order: banners.length }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Błąd"); return; }
    setTitle(""); setLinkUrl(""); setPreviewUrl(null); setUploadedUrl(null);
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Usunąć ten baner?")) return;
    await fetch("/api/admin/banners", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  async function onMove(id: string, dir: -1 | 1) {
    const idx = banners.findIndex(b => b.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    await Promise.all([
      fetch("/api/admin/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: banners[idx].id, sort_order: banners[swapIdx].sort_order }) }),
      fetch("/api/admin/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: banners[swapIdx].id, sort_order: banners[idx].sort_order }) }),
    ]);
    load();
  }

  async function onToggle(id: string, current: boolean) {
    await fetch("/api/admin/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, is_active: !current }) });
    load();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Banery / Promocje</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maksymalnie 3 aktywne banery widoczne na stronie głównej jako przewijany slider.
        </p>
      </div>

      {/* Wymiary info */}
      <div className="rounded-2xl border border-[#40C4A4]/40 bg-[#40C4A4]/5 p-5 space-y-2">
        <p className="text-sm font-semibold text-[#40C4A4] flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Zalecane wymiary zdjęcia
        </p>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-card border border-border p-3">
            <p className="font-semibold">Desktop</p>
            <p className="text-muted-foreground">1920 × 600 px (proporcje 16:5)</p>
            <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG, WebP · Max 15 MB</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <p className="font-semibold">Telefon</p>
            <p className="text-muted-foreground">Obraz jest automatycznie przycinany do środka</p>
            <p className="text-xs text-muted-foreground mt-1">Ważne elementy trzymaj w centrum zdjęcia</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Zdjęcia są automatycznie konwertowane do formatu WebP i przycięte do 1920×600 px.</p>
      </div>

      {/* Formularz dodawania */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Dodaj nowy baner</h2>

        {/* Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Zdjęcie *</label>
          <div
            className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 p-8 cursor-pointer hover:border-[#40C4A4]/60 hover:bg-[#40C4A4]/5 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={onFileChange} />
            {previewUrl ? (
              <div className="relative w-full aspect-[16/5] rounded-lg overflow-hidden">
                <Image src={previewUrl} alt="Podgląd" fill className="object-cover" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">
                    Konwertuję do WebP…
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <p className="text-sm font-medium">Kliknij aby dodać zdjęcie</p>
                <p className="text-xs">JPG, PNG, WebP · max 15 MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Tytuł i link */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Tytuł (opcjonalny)</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="np. Dzień Taty już blisko!"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40C4A4]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link (opcjonalny)</label>
            <input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="np. /sklep lub https://..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40C4A4]/40"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={onAdd}
          disabled={!uploadedUrl || uploading}
          className="w-full rounded-xl bg-[#40C4A4] py-2.5 text-sm font-bold text-white hover:bg-[#40C4A4]/90 disabled:opacity-40 transition-colors"
        >
          {uploading ? "Przesyłam…" : "Dodaj baner"}
        </button>
      </div>

      {/* Lista banerów */}
      <div className="space-y-3">
        <h2 className="font-semibold">
          Aktywne banery ({banners.filter(b => b.is_active).length}/3 widocznych)
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Ładuję…</p>
        ) : banners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Brak banerów. Dodaj pierwszy powyżej.
          </div>
        ) : (
          banners.map((b, idx) => (
            <div key={b.id} className={`rounded-2xl border overflow-hidden ${b.is_active ? "border-border" : "border-border/50 opacity-60"}`}>
              {/* Thumbnail */}
              <div className="relative aspect-[16/5] w-full bg-muted">
                <Image src={b.image_url} alt={b.title ?? "Baner"} fill className="object-cover" sizes="(min-width: 768px) 80vw, 100vw" />
                {!b.is_active && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">Ukryty</span>
                  </div>
                )}
              </div>
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-card">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{b.title ?? "Baner " + (idx + 1)}</p>
                  {b.link_url && (
                    <a href={b.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#40C4A4] hover:underline">
                      <ExternalLink className="h-3 w-3" />{b.link_url}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onMove(b.id, -1)} disabled={idx === 0} title="Przesuń wyżej"
                    className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => onMove(b.id, 1)} disabled={idx === banners.length - 1} title="Przesuń niżej"
                    className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button
                    onClick={() => onToggle(b.id, b.is_active)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${b.is_active ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {b.is_active ? "Widoczny" : "Ukryty"}
                  </button>
                  <button onClick={() => onDelete(b.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
