"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  parent_id: string | null;
  sort_order: number;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

// ─────────────────────────────────────────────────────────────────────────────

export function KategorieAdmin({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const parents = categories
    .filter((c) => c.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Usunąć kategorię „${name}"? Usunięcie rodzica usuwa też podkategorie.`)) return;
    setBusy(id);
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategorie</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zarządzaj hierarchią kategorii sklepu. Kategorie główne i podkategorie.
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Nowa kategoria
          </Button>
        )}
      </div>

      {showAddForm && (
        <AddCategoryForm
          parents={parents}
          onSaved={() => { setShowAddForm(false); router.refresh(); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="space-y-3">
        {parents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            Brak kategorii. Dodaj pierwszą.
          </div>
        )}
        {parents.map((parent) => {
          const children = categories
            .filter((c) => c.parent_id === parent.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const isExpanded = expanded[parent.id] ?? true;

          return (
            <div
              key={parent.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [parent.id]: !isExpanded }))
                  }
                  className="rounded p-0.5 hover:bg-muted"
                  aria-label={isExpanded ? "Zwiń" : "Rozwiń"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                <CategoryRowEdit
                  cat={parent}
                  busy={busy === parent.id}
                  onDelete={() => deleteCategory(parent.id, parent.name)}
                  onSaved={() => router.refresh()}
                />

                <span className="ml-auto text-xs text-muted-foreground">
                  {children.length} podkat.
                </span>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-muted/20 px-4 py-2 space-y-1">
                  {children.map((child) => (
                    <div key={child.id} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-muted/60">
                      <span className="mr-1 text-muted-foreground">↳</span>
                      <CategoryRowEdit
                        cat={child}
                        busy={busy === child.id}
                        onDelete={() => deleteCategory(child.id, child.name)}
                        onSaved={() => router.refresh()}
                      />
                    </div>
                  ))}
                  <AddSubcategoryInline parentId={parent.id} onSaved={() => router.refresh()} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Edycja nazwy w wierszu ────────────────────────────────────────────────

function CategoryRowEdit({
  cat,
  busy,
  onDelete,
  onSaved,
}: {
  cat: CategoryRow;
  busy: boolean;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(cat.name);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    if (!name.trim() || name === cat.name) { setEditing(false); return; }
    setSaving(true);
    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      onSaved();
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  return (
    <div className="flex flex-1 items-center gap-2 min-w-0">
      {editing ? (
        <>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
              if (e.key === "Escape") { setName(cat.name); setEditing(false); }
            }}
            className="flex-1 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => void save()}
            disabled={saving}
            className="rounded p-1 text-primary hover:bg-primary/10"
            aria-label="Zapisz"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { setName(cat.name); setEditing(false); }}
            className="rounded p-1 hover:bg-muted"
            aria-label="Anuluj"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{cat.name}</p>
            <p className="text-xs text-muted-foreground">/sklep?category={cat.slug}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="ml-1 shrink-0 rounded p-1 hover:bg-muted"
            aria-label="Edytuj nazwę"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="shrink-0 rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-40"
            aria-label="Usuń"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Formularz dodawania nowej kategorii głównej ───────────────────────────

function AddCategoryForm({
  parents,
  onSaved,
  onCancel,
}: {
  parents: CategoryRow[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [parentId, setParentId] = React.useState<string>("");
  const [sortOrder, setSortOrder] = React.useState("100");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError("Nazwa i slug są wymagane.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          parentId: parentId || null,
          sortOrder: parseInt(sortOrder, 10) || 100,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Błąd zapisu.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4 shadow-sm"
    >
      <p className="text-sm font-semibold">Nowa kategoria</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Nazwa *
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Zodiak i Astrologia"
            required
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Slug (URL) *
          </span>
          <input
            value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
            placeholder="np. zodiak-i-astrologia"
            pattern="[a-z0-9\-]+"
            required
            className={inputCls}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          Opis (opcjonalny)
        </span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Krótki opis kategorii..."
          className={inputCls}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Kategoria nadrzędna (jeśli podkategoria)
          </span>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={inputCls}
          >
            <option value="">— brak (kategoria główna) —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Kolejność wyświetlania
          </span>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm hover:bg-muted"
        >
          Anuluj
        </button>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Dodaj kategorię
        </Button>
      </div>
    </form>
  );
}

// ─── Dodawanie podkategorii inline pod rodzicem ─────────────────────────────

function AddSubcategoryInline({
  parentId,
  onSaved,
}: {
  parentId: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          parentId,
          sortOrder: 100,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Błąd zapisu.");
        return;
      }
      setName(""); setSlug(""); setSlugTouched(false);
      setOpen(false);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <Plus className="h-3 w-3" />
        Dodaj podkategorię
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-background p-3">
      <label className="block">
        <span className="mb-1 block text-xs text-muted-foreground">Nazwa</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Pamiętniki Wampirów"
          required
          className="w-44 rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-muted-foreground">Slug</span>
        <input
          value={slug}
          onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
          placeholder="pamietniki-wampirow"
          pattern="[a-z0-9\-]+"
          required
          className="w-44 rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        Dodaj
      </Button>
      <button
        type="button"
        onClick={() => { setOpen(false); setError(null); }}
        className="rounded p-1.5 hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}
