import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * UKRYTY layout panelu — przed renderem sprawdza:
 *  1. slug w URL == ADMIN_URL_SECRET (inaczej 404 — udajemy że strony nie ma)
 *  2. zalogowany user ma rolę ADMIN w tabeli `profiles` (inaczej 404)
 *
 * Tytuł i klasy CSS celowo nie zawierają słowa „admin" — gdyby ktoś
 * przypadkiem trafił, nie domyśli się czego szukał.
 */
export const metadata = { title: "Panel zarządzania" };

export default async function HiddenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { adminSlug: string };
}) {
  // 1. Slug musi się zgadzać. Inaczej udajemy 404.
  if (params.adminSlug !== env.ADMIN_URL_SECRET) notFound();

  // 2. Sprawdzenie roli (defense in depth — middleware też sprawdza).
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${params.adminSlug}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "ADMIN") notFound();

  const base = `/${params.adminSlug}`;
  const items = [
    { href: base, label: "Dashboard" },
    { href: `${base}/zamowienia`, label: "Zamówienia" },
    { href: `${base}/produkty`, label: "Produkty" },
    { href: `${base}/dostawa`, label: "Dostawa" },
    { href: `${base}/rabaty`, label: "Rabaty" },
    { href: `${base}/uzytkownicy`, label: "Użytkownicy" },
  ];
  return (
    <div className="min-h-[calc(100vh-4rem)] md:grid md:grid-cols-[220px_1fr]">
      {/* Sidebar: pion na ≥md, poziomy scroll na mobile */}
      <aside className="border-b border-border bg-card md:border-b-0 md:border-r md:p-5">
        <p className="hidden px-5 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:block md:mb-6 md:p-0">
          Zarządzanie
        </p>
        <nav className="flex gap-1 overflow-x-auto p-3 text-sm md:flex-col md:p-0">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 hover:bg-muted"
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
