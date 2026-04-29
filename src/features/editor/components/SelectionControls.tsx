"use client";

import * as React from "react";
import {
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorState } from "../hooks/useEditorState";
import { FONTS, CATEGORY_LABELS, type FontCategory } from "../fonts";
import { cn } from "@/lib/utils";

/**
 * Panel kontroli zaznaczonego elementu (tekst lub obrazek).
 * Canva-style: wybór fontu, formatowanie, kolor, rozmiar, obrót.
 */
export function SelectionControls() {
  const { selectedId, elements, updateElement, removeElement } =
    useEditorState();
  const sel = elements.find((e) => e.id === selectedId);

  if (!sel) {
    return (
      <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
        Kliknij element na podglądzie, aby go edytować.
      </p>
    );
  }

  if (sel.kind === "text") {
    return (
      <div className="space-y-3 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tekst
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeElement(sel.id)}
            aria-label="Usuń"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <textarea
          value={sel.text}
          onChange={(e) => updateElement(sel.id, { text: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Twój napis"
        />

        {/* Formatowanie B / I / U / align */}
        <div className="flex flex-wrap gap-1">
          <FormatToggle
            active={!!sel.bold}
            onClick={() => updateElement(sel.id, { bold: !sel.bold })}
            label="Pogrubienie"
          >
            <Bold className="h-4 w-4" />
          </FormatToggle>
          <FormatToggle
            active={!!sel.italic}
            onClick={() => updateElement(sel.id, { italic: !sel.italic })}
            label="Kursywa"
          >
            <Italic className="h-4 w-4" />
          </FormatToggle>
          <FormatToggle
            active={!!sel.underline}
            onClick={() => updateElement(sel.id, { underline: !sel.underline })}
            label="Podkreślenie"
          >
            <Underline className="h-4 w-4" />
          </FormatToggle>
          <div className="ml-auto flex gap-1">
            <FormatToggle
              active={(sel.align ?? "left") === "left"}
              onClick={() => updateElement(sel.id, { align: "left" })}
              label="Do lewej"
            >
              <AlignLeft className="h-4 w-4" />
            </FormatToggle>
            <FormatToggle
              active={sel.align === "center"}
              onClick={() => updateElement(sel.id, { align: "center" })}
              label="Wyśrodkowanie"
            >
              <AlignCenter className="h-4 w-4" />
            </FormatToggle>
            <FormatToggle
              active={sel.align === "right"}
              onClick={() => updateElement(sel.id, { align: "right" })}
              label="Do prawej"
            >
              <AlignRight className="h-4 w-4" />
            </FormatToggle>
          </div>
        </div>

        {/* Wybór czcionki — Canva-style z podziałem na kategorie */}
        <FontPicker
          value={sel.fontFamily}
          onChange={(family) => updateElement(sel.id, { fontFamily: family })}
        />

        {/* Slider rozmiaru */}
        <SliderRow
          label="Rozmiar"
          unit="px"
          min={8}
          max={200}
          value={sel.fontSize}
          onChange={(v) => updateElement(sel.id, { fontSize: v })}
        />

        {/* Odstęp liter */}
        <SliderRow
          label="Odstęp liter"
          unit="px"
          min={-10}
          max={50}
          value={sel.letterSpacing ?? 0}
          onChange={(v) => updateElement(sel.id, { letterSpacing: v })}
        />

        {/* Wysokość linii */}
        <SliderRow
          label="Interlinia"
          unit="x"
          min={0.8}
          max={3}
          step={0.1}
          value={sel.lineHeight ?? 1.2}
          onChange={(v) => updateElement(sel.id, { lineHeight: v })}
          format={(v) => v.toFixed(1)}
        />

        {/* Kolor */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-muted-foreground">Kolor</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={sel.fill}
              onChange={(e) => updateElement(sel.id, { fill: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
            />
            <span className="font-mono text-xs text-muted-foreground">
              {sel.fill}
            </span>
          </div>
        </div>

        {/* Obrót */}
        <SliderRow
          label="Obrót"
          unit="°"
          min={-180}
          max={180}
          value={sel.rotation}
          onChange={(v) => updateElement(sel.id, { rotation: v })}
        />
      </div>
    );
  }

  // image
  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Obrazek
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeElement(sel.id)}
          aria-label="Usuń"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <SliderRow
        label="Szerokość"
        unit="px"
        min={20}
        max={600}
        value={sel.width}
        onChange={(w) => {
          const ratio = sel.height / sel.width;
          updateElement(sel.id, { width: w, height: w * ratio });
        }}
      />

      <SliderRow
        label="Obrót"
        unit="°"
        min={-180}
        max={180}
        value={sel.rotation}
        onChange={(v) => updateElement(sel.id, { rotation: v })}
      />
    </div>
  );
}

// ============== sub-components ==============

function FormatToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border transition",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SliderRow({
  label,
  unit,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <label className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {format ? format(value) : Math.round(value)} {unit}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--primary))]"
      />
    </div>
  );
}

function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (family: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const [category, setCategory] = React.useState<FontCategory | "all">("all");
  const filtered = React.useMemo(() => {
    return FONTS.filter(
      (f) =>
        (category === "all" || f.category === category) &&
        f.family.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [filter, category]);

  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">
        Czcionka
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-left text-sm hover:bg-muted"
        style={{ fontFamily: value }}
      >
        <span>{value}</span>
        <span className="text-xs text-muted-foreground">▾</span>
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-border bg-card p-2">
          <input
            placeholder="Szukaj czcionki…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-2 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mb-2 flex flex-wrap gap-1">
            <CategoryChip
              active={category === "all"}
              onClick={() => setCategory("all")}
            >
              Wszystkie
            </CategoryChip>
            {(Object.keys(CATEGORY_LABELS) as FontCategory[]).map((c) => (
              <CategoryChip
                key={c}
                active={category === c}
                onClick={() => setCategory(c)}
              >
                {CATEGORY_LABELS[c]}
              </CategoryChip>
            ))}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((f) => (
              <button
                key={f.family}
                type="button"
                onClick={() => {
                  onChange(f.family);
                  setOpen(false);
                }}
                style={{ fontFamily: f.family }}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-base hover:bg-muted",
                  value === f.family && "bg-primary/10 text-primary",
                )}
              >
                {f.family}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Brak wyników.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs transition",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}
