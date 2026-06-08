"use client";

import * as React from "react";
import Image from "next/image";
import { Trash2, Upload, ArrowUp, ArrowDown, ExternalLink, ImageIcon, Monitor, Smartphone } from "lucide-react";

type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  image_url_mobile: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

type UploadState = { preview: string | null; url: string | null; busy: boolean };
const emptyUpload = (): UploadState => ({ preview: null, url: null, busy: false });

export function BaneryAdmin({ adminSlug }: { adminSlug: string }) {
  void adminSlug;
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [title, setTitle] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [desktop, setDesktop] = React.useState<UploadState>(emptyUpload());
  const [mobile, setMobile] = React.useState<UploadState>(emptyUpload());
  const [error, setError] = React.useState("");
  const desktopRef = React.useRef<HTMLInputElement>(null);
  const mobileRef = React.useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/banners");
    const data = await res.json();
    setBanners(data.banners ?? []);
    setLoading(false);
  }
  React.useEffect(() => { load(); }, []);

  async function uploadFile(file: File, device: "desktop" | "mobile", setter: React.Dispatch<React.SetStateAction<UploadState>>) {
    setter(s => ({ ...s, preview: URL.createObjectURL(file), busy: true }));
    const form = new FormData();
    form.append("file", file);
    form.append("device", device);
    const res = await fetch("/api/admin/banners/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Błąd upload");
      setter(emptyUpload());
    } else {
      setter(s => ({ ...s, url: data.url, busy: false }));
    }
  }

  async function onAdd() {
    if (!desktop.url) { setError("Zdjęcie desktopowe jest wymagane"); return; }
    setError("");
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || null,
        image_url: desktop.url,
        image_url_mobile: mobile.url ?? null,
        link_url: linkUrl || null,
        sort_order: banners.length,
      }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Błąd"); return; }
    setTitle(""); setLinkUrl(""); setDesktop(emptyUpload()); setMobile(emptyUpload());
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

  function UploadZone({ label, hint, device, state, setter, inputRef, aspect }: {
    label: string; hint: string; device: "desktop" | "mobile";
    state: UploadState; setter: React.Dispatch<React.SetStateAction<UploadState>>;
    inputRef: React.RefObject<HTMLInputElement>; aspect: string;
  }) {
    return (
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
          {device === "desktop" ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
          {label}
        </label>
        <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
        <div
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/40 p-4 cursor-pointer transition-colors ${state.url ? "border-[#40C4A4]" : "border-border hover:border-[#40C4A4]/60 hover:bg-[#40C4A4]/5"}`}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, device, setter); e.target.value = ""; }}
          />
          {state.preview ? (
            <div className={`relative w-full rounded-lg overflow-hidden ${aspect}`}>
              <Image src={state.preview} alt="Podgląd" fill className="object-cover" />
              {state.busy && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-semibold">
                  Konwertuję…
                </div>
              )}
              {state.url && !state.busy && (
                <div className="absolute bottom-2 right-2 rounded-full bg-[#40C4A4] px-2 py-0.5 text-xs font-bold text-white">✓ OK</div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground py-4">
              <Upload className="h-6 w-6" />
              <p className="text-xs">Kliknij aby wybrać plik</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Banery / Promocje</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maksymalnie 3 aktywne banery — przewijany slider na stronie głównej.
        </p>
      </div>

      {/* Wymiary info */}
      <div className="rounded-2xl border border-[#40C4A4]/40 bg-[#40C4A4]/5 p-5 space-y-3">
        <p className="text-sm font-semibold text-[#40C4A4] flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Wymagane rozmiary zdjęć
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-card border border-border p-4 space-y-1">
            <p className="flex items-center gap-1.5 font-semibold text-sm"><Monitor className="h-4 w-4" /> Desktop</p>
            <p className="text-lg font-bold">1920 × 600 px</p>
            <p className="text-xs text-muted-foreground">Proporcje 16:5 · szeroki poziomy pasek</p>
            <p className="text-xs text-muted-foreground">Format wejściowy: JPG, PNG, WebP · max 15 MB</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 space-y-1">
            <p className="flex items-center gap-1.5 font-semibold text-sm"><Smartphone className="h-4 w-4" /> Telefon</p>
            <p className="text-lg font-bold">640 × 960 px</p>
            <p className="text-xs text-muted-foreground">Proporcje 2:3 · pionowy, czytelny na ekranie</p>
            <p className="text-xs text-muted-foreground">Opcjonalne — bez niego wyświetli się wersja desktopowa</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Pliki są automatycznie konwertowane do WebP i przycinane do podanych wymiarów.</p>
      </div>

      {/* Formularz dodawania */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <h2 className="font-semibold">Dodaj nowy baner</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <UploadZone
            label="Zdjęcie desktopowe *"
            hint="1920×600 px — wymagane"
            device="desktop" state={desktop} setter={setDesktop} inputRef={desktopRef}
            aspect="aspect-[16/5]"
          />
          <UploadZone
            label="Zdjęcie mobilne"
            hint="640×960 px — opcjonalne"
            device="mobile" state={mobile} setter={setMobile} inputRef={mobileRef}
            aspect="aspect-[2/3]"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Tytuł (opcjonalny)</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="np. Dzień Taty już blisko!"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40C4A4]/40" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link (opcjonalny)</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              placeholder="np. /sklep lub https://..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40C4A4]/40" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button onClick={onAdd} disabled={!desktop.url || desktop.busy || mobile.busy}
          className="w-full rounded-xl bg-[#40C4A4] py-2.5 text-sm font-bold text-white hover:bg-[#40C4A4]/90 disabled:opacity-40 transition-colors">
          Dodaj baner
        </button>
      </div>

      {/* Lista */}
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
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto]">
                {/* Desktop thumb */}
                <div className="relative aspect-[16/5] w-full bg-muted">
                  <Image src={b.image_url} alt={b.title ?? "Baner"} fill className="object-cover" sizes="80vw" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white flex items-center gap-1">
                    <Monitor className="h-2.5 w-2.5" /> Desktop
                  </span>
                  {!b.is_active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">Ukryty</span>
                    </div>
                  )}
                </div>
                {/* Mobile thumb */}
                {b.image_url_mobile && (
                  <div className="relative w-full sm:w-28 aspect-[2/3] bg-muted border-t sm:border-t-0 sm:border-l border-border">
                    <Image src={b.image_url_mobile} alt="Mobil" fill className="object-cover" sizes="112px" />
                    <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white flex items-center gap-0.5">
                      <Smartphone className="h-2 w-2" />
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-card">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{b.title ?? `Baner ${idx + 1}`}</p>
                  {b.link_url && (
                    <a href={b.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#40C4A4] hover:underline">
                      <ExternalLink className="h-3 w-3" />{b.link_url}
                    </a>
                  )}
                  {!b.image_url_mobile && (
                    <p className="text-xs text-amber-500">Brak wersji mobilnej — wyświetla się wersja desktopowa</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onMove(b.id, -1)} disabled={idx === 0} className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => onMove(b.id, 1)} disabled={idx === banners.length - 1} className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={() => onToggle(b.id, b.is_active)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${b.is_active ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
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
