"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Pokazuje stan zalogowania w navbarze.
 * - Niezalogowany: ikona logowania → /login
 * - Zalogowany: dropdown z emailem + linki + Wyloguj
 */
export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = React.useState<string | null>(null);
  const [adminUrl, setAdminUrl] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function refresh() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      // Pobieramy tajny URL admina TYLKO przez serwerowy endpoint.
      // Niezalogowani / nie-admini dostają 404 (i nigdy nie zobaczą URL).
      if (data.user) {
        try {
          const res = await fetch("/api/me/admin-url");
          if (res.ok) {
            const { url } = await res.json();
            if (mounted) setAdminUrl(url);
          } else {
            if (mounted) setAdminUrl(null);
          }
        } catch {
          if (mounted) setAdminUrl(null);
        }
      } else {
        if (mounted) setAdminUrl(null);
      }
    }

    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!email) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="icon" aria-label="Zaloguj">
          <LogIn className="h-5 w-5" />
        </Button>
      </Link>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Konto"
        onClick={() => setOpen(!open)}
      >
        <UserIcon className="h-5 w-5" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
            <p className="truncate px-3 py-2 text-xs text-muted-foreground">
              {email}
            </p>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              <UserIcon className="h-4 w-4" />
              Twój profil
            </Link>
            {adminUrl && (
              <Link
                href={adminUrl}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary hover:bg-muted"
              >
                <ShieldCheck className="h-4 w-4" />
                Panel administratora
              </Link>
            )}
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Wyloguj
            </button>
          </div>
        </>
      )}
    </div>
  );
}
