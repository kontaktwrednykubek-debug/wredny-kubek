import Link from "next/link";

/**
 * Layout panelu administratora — izolowany od głównego sklepu.
 * Dostęp blokowany przez middleware (rola ADMIN w tabeli `profiles`).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[220px_1fr]">
      <aside className="border-r border-border bg-card p-5">
        <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-muted">
            Dashboard
          </Link>
          <Link
            href="/admin/zamowienia"
            className="rounded-lg px-3 py-2 hover:bg-muted"
          >
            Zamówienia
          </Link>
          <Link
            href="/admin/produkty"
            className="rounded-lg px-3 py-2 hover:bg-muted"
          >
            Produkty
          </Link>
          <Link
            href="/admin/uzytkownicy"
            className="rounded-lg px-3 py-2 hover:bg-muted"
          >
            Użytkownicy
          </Link>
        </nav>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
