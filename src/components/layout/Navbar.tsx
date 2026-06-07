"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { brand } from "@/config/theme";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { CartIcon } from "@/components/layout/CartIcon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "Główna" },
  { href: "/sklep", label: "Sklep" },
  { href: "/nowosci", label: "Nowości" },
  { href: "/edytor", label: "Twój Projekt" },
  { href: "/koszyk", label: "Koszyk" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showLoginPopup, setShowLoginPopup] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  async function handleHeartClick() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      router.push("/account/ulubione");
    } else {
      setShowLoginPopup(true);
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between gap-2 px-4 sm:gap-4">
          <Link href="/" aria-label={brand.name} className="flex h-full items-center">
            <Image src="/wk-logo-light.png" alt={brand.name} width={160} height={80} priority className="block h-14 w-auto object-contain dark:hidden sm:h-16" />
            <Image src="/wk-logo-dark.png" alt={brand.name} width={160} height={80} priority className="hidden h-14 w-auto object-contain dark:block sm:h-16" />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop icons */}
          <div className="hidden items-center gap-1 sm:gap-2 md:flex">
            <Button variant="ghost" size="icon" aria-label="Ulubione" onClick={handleHeartClick}>
              <Heart className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Szukaj">
              <Search className="h-6 w-6" />
            </Button>
            <CartIcon />
            <UserMenu />
            <ThemeToggle />
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <CartIcon />
            <Button
              variant="ghost"
              size="icon"
              aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          {/* Top bar */}
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-4">
            <Link href="/" onClick={() => setMenuOpen(false)} aria-label={brand.name}>
              <Image src="/wk-logo-light.png" alt={brand.name} width={140} height={70} className="block h-12 w-auto dark:hidden" />
              <Image src="/wk-logo-dark.png" alt={brand.name} width={140} height={70} className="hidden h-12 w-auto dark:block" />
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Zamknij menu">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Auth + theme row — above nav links */}
          <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-3">
            {userEmail ? (
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-destructive hover:underline"
              >
                Wyloguj się
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold hover:underline"
              >
                Zaloguj się
              </Link>
            )}
            <ThemeToggle />
          </div>

          {/* Nav links — centered */}
          <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-4 py-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="w-full rounded-xl px-4 py-4 text-center text-xl font-semibold transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Login required popup */}
      {showLoginPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowLoginPopup(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
                <Heart className="h-7 w-7 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Zaloguj się</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aby przeglądać ulubione produkty, musisz być zalogowany.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Link href="/login" className="w-full" onClick={() => setShowLoginPopup(false)}>
                  <Button className="w-full">Zaloguj się</Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={() => setShowLoginPopup(false)}>
                  Anuluj
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
