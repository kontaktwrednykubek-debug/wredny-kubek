"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X } from "lucide-react";
import { brand } from "@/config/theme";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { CartIcon } from "@/components/layout/CartIcon";

const navItems = [
  { href: "/", label: "Główna" },
  { href: "/sklep", label: "Sklep" },
  { href: "/edytor", label: "Twój Projekt" },
  { href: "/koszyk", label: "Koszyk" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Zamykaj menu przy zmianie rozmiaru na desktop.
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between gap-2 px-4 sm:gap-4">
        <Link
          href="/"
          aria-label={brand.name}
          className="flex h-full items-center"
        >
          <Image
            src="/logo_wredny_kubek.png"
            alt={brand.name}
            width={160}
            height={80}
            priority
            className="h-14 w-auto object-contain sm:h-16"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Szukaj"
            className="hidden sm:inline-flex"
          >
            <Search className="h-5 w-5" />
          </Button>
          <CartIcon />
          <UserMenu />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
