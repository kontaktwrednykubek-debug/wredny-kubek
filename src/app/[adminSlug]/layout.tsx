import { notFound, redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./AdminSidebar";

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
  return (
    <div className="min-h-[calc(100vh-4rem)] md:grid md:grid-cols-[240px_1fr]">
      <AdminSidebar base={base} />
      <main className="p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
