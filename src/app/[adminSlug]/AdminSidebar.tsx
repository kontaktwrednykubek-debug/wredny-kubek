"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, ShoppingCart, Package, Tags, Palette, Truck, Percent, Users, MessageSquare } from "lucide-react";

type Item = { href: string; label: string; icon: React.ReactNode };

export function AdminSidebar({ base }: { base: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const items: Item[] = [
    { href: base, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `${base}/zamowienia`, label: "Zamówienia", icon: <ShoppingCart className="h-4 w-4" /> },
    { href: `${base}/produkty`, label: "Produkty", icon: <Package className="h-4 w-4" /> },
    { href: `${base}/kategorie`, label: "Kategorie", icon: <Tags className="h-4 w-4" /> },
    { href: `${base}/warianty`, label: "Warianty", icon: <Palette className="h-4 w-4" /> },
    { href: `${base}/dostawa`, label: "Dostawa", icon: <Truck className="h-4 w-4" /> },
    { href: `${base}/rabaty`, label: "Rabaty", icon: <Percent className="h-4 w-4" /> },
    { href: `${base}/uzytkownicy`, label: "Użytkownicy", icon: <Users className="h-4 w-4" /> },
    { href: `${base}/opinie`, label: "Opinie", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  // Active match: exact for dashboard, startsWith for sub-routes
  const isActive = (href: string) =>
    href === base ? pathname === base : pathname?.startsWith(href);

  // Zamknij drawer na zmianie route
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Blokuj scroll body gdy drawer otwarty
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const currentLabel =
    items.find((it) => isActive(it.href))?.label ?? "Panel";

  return (
    <>
      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          aria-label="Otwórz menu"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
        <p className="text-sm font-semibold">{currentLabel}</p>
        <div className="w-[68px]" aria-hidden />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Zarządzanie
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-muted"
                aria-label="Zamknij menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3 text-sm">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                    isActive(it.href)
                      ? "bg-primary/10 font-semibold text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {it.icon}
                  {it.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border bg-card p-5 md:block">
        <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Zarządzanie
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                isActive(it.href)
                  ? "bg-primary/10 font-semibold text-primary"
                  : "hover:bg-muted"
              }`}
            >
              {it.icon}
              {it.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
