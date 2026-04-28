# Kubkomania

Skalowalna platforma e-commerce do personalizacji produktów (kubki, koszulki, gadżety) zbudowana w **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase**, **Stripe** i **react-konva**.

## ✨ Funkcje

- 🎨 **Reużywalny silnik edytora** — jeden „mózg" obsługuje wszystkie produkty (`react-konva`).
- 🧱 **Konfiguracja produktów w jednym pliku** (`src/config/products.ts`) — dodanie nowego produktu = 5 linii kodu.
- 🌗 **Dark mode** + **globalna paleta kolorów** w `src/config/theme.ts` (zmiana w jednym miejscu zmienia całą aplikację).
- 🔒 **Bezpieczeństwo**: walidacja env (Zod), Supabase Auth, RLS, izolowany `/admin` przez middleware.
- 💳 **Stripe Checkout** — cena liczona po stronie serwera (klient nie ustala kwoty).
- 📱 **PWA** (next-pwa) — instalowalny sklep + osobny manifest dla admina możliwy.
- 🪞 **Eksport do druku 300 DPI** + lustrzane odbicie (sublimacja kubków).

## 🗂 Struktura projektu

```
src/
├── app/                    # App Router (strony + API)
│   ├── api/checkout/       # Stripe sessions
│   ├── admin/              # Panel admina (chroniony middleware)
│   ├── account/            # Profil użytkownika
│   └── edytor, sklep, ... 
├── config/
│   ├── products.ts         # ⭐ konfiguracja produktów
│   └── theme.ts            # ⭐ globalna paleta + branding
├── features/
│   ├── editor/             # silnik edytora (Stage, ProductSwitcher, ...)
│   ├── catalog/            # galeria produktów
│   └── checkout/           # koszyk + Stripe
├── lib/
│   ├── env.ts              # Zod-walidowane env
│   ├── supabase/           # klienci client/server
│   ├── canvas/export.ts    # PNG 300 DPI + mirror
│   └── pricing.ts          # logika ceny (server-only)
├── components/             # UI primitives + layout
└── middleware.ts           # ochrona /admin (rola ADMIN)
supabase/migrations/        # schemat bazy + RLS
```

## 🚀 Start

```bash
# 1. Instalacja
npm install

# 2. Skonfiguruj zmienne
cp .env.example .env.local
# uzupełnij NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ...

# 3. Uruchom migrację Supabase
# wklej supabase/migrations/0001_init.sql do SQL Editora

# 4. Dev
npm run dev
```

## ➕ Dodanie nowego produktu

Edytuj `src/config/products.ts`:

```ts
hoodie: {
  id: "hoodie",
  name: "Bluza z kapturem",
  basePrice: 14900,
  canvas: { widthMm: 280, heightMm: 360, widthPx: 340, heightPx: 440, ... },
  previewImage: "/products/hoodie/preview.png",
  ...
},
```

…i dodaj `"hoodie"` do typu `ProductId`. **Edytor i katalog automatycznie go obsłużą.**

## 🎨 Zmiana palety kolorów

Wszystkie kolory żyją w dwóch miejscach (zsynchronizowanych):
- `src/config/theme.ts` — referencja TS dla developera
- `src/app/globals.css` — zmienne CSS (`--primary`, `--background`, …) używane przez Tailwind

Zmień wartości HSL w obu plikach — cała aplikacja się przemaluje.

## 🛠 Stack

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Język | TypeScript |
| Styling | Tailwind CSS + CSS variables |
| Canvas | react-konva |
| Auth + DB | Supabase (Postgres + RLS) |
| Płatności | Stripe |
| State | Zustand |
| PWA | next-pwa |
| Walidacja | Zod |

## 📋 TODO (kolejne iteracje)

- [ ] Webhook Stripe (`/api/webhooks/stripe`) zapisujący zamówienia
- [ ] Strona admina: lista zamówień + zmiana statusu + paczka plików do druku (ZIP)
- [ ] Zapisywanie projektu w bazie (designs) z thumbnaili
- [ ] Realne zdjęcia produktów + maski cieni (overlay)
- [ ] Testy e2e (Playwright)
