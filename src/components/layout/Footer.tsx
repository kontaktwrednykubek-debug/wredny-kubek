import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { brand } from "@/config/theme";

const cols = [
  {
    title: "Sklep",
    links: [
      { href: "/sklep", label: "Wszystkie produkty" },
      { href: "/sklep/kubki", label: "Kubki" },
      { href: "/sklep/koszulki", label: "Koszulki" },
      { href: "/sklep/gadzety", label: "Gadżety" },
    ],
  },
  {
    title: "Konto",
    links: [
      { href: "/login", label: "Zaloguj" },
      { href: "/account", label: "Twój profil" },
      { href: "/account/zamowienia", label: "Zamówienia" },
      { href: "/account/projekty", label: "Zapisane projekty" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-primary">{brand.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{brand.tagline}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-sm font-semibold">{c.title}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="mb-3 text-sm font-semibold">Obserwuj</p>
          <div className="flex gap-3 text-muted-foreground">
            <Facebook className="h-5 w-5" />
            <Instagram className="h-5 w-5" />
            <Youtube className="h-5 w-5" />
          </div>
          <Link
            href="/admin"
            className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground"
          >
            Panel Administratora →
          </Link>
        </div>
      </div>
    </footer>
  );
}
