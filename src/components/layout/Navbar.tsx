"use client";

import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { brand } from "@/config/theme";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/", label: "Główna" },
  { href: "/sklep", label: "Sklep" },
  { href: "/edytor", label: "Twój Projekt" },
  { href: "/koszyk", label: "Koszyk" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          {brand.name}
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

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Szukaj">
            <Search className="h-5 w-5" />
          </Button>
          <Link href="/koszyk">
            <Button variant="ghost" size="icon" aria-label="Koszyk">
              <ShoppingBag className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="icon" aria-label="Konto">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
