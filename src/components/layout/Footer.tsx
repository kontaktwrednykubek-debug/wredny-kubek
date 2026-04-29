import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";
import { brand } from "@/config/theme";

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100065502589619",
    Icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/wrednykubek/",
    Icon: Instagram,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@wredny.kubek",
    Icon: TikTokIcon,
  },
];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.86a8.16 8.16 0 0 0 4.77 1.52V6.93a4.85 4.85 0 0 1-1.84-.24z" />
    </svg>
  );
}

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
    <footer className="w-full overflow-x-hidden border-t border-border bg-card">
      <div className="container mx-auto grid gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link href="/" aria-label={brand.name} className="inline-block">
            <Image
              src="/wk.kubek.png"
              alt={brand.name}
              width={160}
              height={60}
              className="h-12 w-auto object-contain"
            />
          </Link>
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
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="transition-colors hover:text-primary"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {brand.name}. Wszystkie prawa zastrzeżone.</p>
          <p>
            Wykonanie:{" "}
            <a
              href="https://www.andrzejmich.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              Andrzej Mich
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
