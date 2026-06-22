import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { HeroSearch } from "@/components/HeroSearch";
import {
  ProductCarousel,
  type CarouselProduct,
} from "@/features/catalog/ProductCarousel";
import {
  CategoryCarousel,
  type CategoryCard,
} from "@/features/catalog/CategoryCarousel";
import { BannerSlider } from "@/components/BannerSlider";
import Marquee from "@/components/Marquee";
import { TikTokSection } from "@/features/tiktok/TikTokSection";
import { getAdultCategorySlugs } from "@/lib/adult";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const bannersRes = await supabase
    .from("banners")
    .select("id, title, image_url, image_url_mobile, alt_text, link_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(3);
  const activeBanners = bannersRes.data ?? [];

  const [carouselRes, categoriesRes, productsForCoverRes, featuredRes, bestsellersRes] = await Promise.all([
    supabase
      .from("shop_products")
      .select("slug, title, price_grosze, images, rating, reviews_count, variants, category, categories")
      .eq("is_published", true)
      .neq("category", "merch")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("categories")
      .select("id, slug, name, description, image_url, parent_id, sort_order")
      .is("parent_id", null)
      .neq("is_visible", false)
      .order("sort_order", { ascending: true }),
    supabase
      .from("shop_products")
      .select("category, images")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("shop_products")
      .select("slug, title, price_grosze, images, rating, reviews_count, variants, category, categories")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("shop_products")
      .select("slug, title, price_grosze, images, rating, reviews_count, variants, category, categories")
      .eq("is_published", true)
      .contains("labels", ["bestseller"])
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  // Strona główna nie pokazuje treści 18+ — odfiltrowujemy produkty i kategorie
  // dla dorosłych z karuzel i kolażu (są dostępne w sklepie za bramką wieku).
  const adultCatSlugs = await getAdultCategorySlugs(supabase);
  const isAdultProduct = (p: { category?: unknown; categories?: unknown }) => {
    const cats =
      (p.categories as string[] | null) ?? [(p.category as string | null) ?? ""];
    return cats.some((c) => adultCatSlugs.has(c));
  };
  const products = (carouselRes.data ?? []).filter(
    (p) => !isAdultProduct(p),
  ) as CarouselProduct[];
  const featuredProducts = (featuredRes.data ?? []).filter(
    (p) => !isAdultProduct(p),
  ) as CarouselProduct[];
  const bestsellerProducts = (bestsellersRes.data ?? []).filter(
    (p) => !isAdultProduct(p),
  ) as CarouselProduct[];

  // Mapowanie kategorii → pierwsze zdjęcie produktu z tej kategorii (lub child).
  const allCats = categoriesRes.data ?? [];
  // Pobierz dzieci dla każdego rodzica (drugie zapytanie w pamięci).
  const allCatsRes = await supabase
    .from("categories")
    .select("id, slug, parent_id")
    .neq("is_visible", false);
  const childrenMap = new Map<string, string[]>();
  for (const c of allCatsRes.data ?? []) {
    if (c.parent_id) {
      const arr = childrenMap.get(c.parent_id as string) ?? [];
      arr.push(c.slug as string);
      childrenMap.set(c.parent_id as string, arr);
    }
  }
  const productsByCat = new Map<string, string[]>();
  for (const p of productsForCoverRes.data ?? []) {
    const cat = (p.category as string | null) ?? "";
    if (adultCatSlugs.has(cat)) continue; // nie używaj okładek 18+
    const imgs = (p.images as string[]) ?? [];
    const cover = imgs[0] ?? "";
    if (!productsByCat.has(cat)) productsByCat.set(cat, []);
    if (cover) productsByCat.get(cat)!.push(cover);
  }
  const categoryCards: CategoryCard[] = allCats
    .filter((c) => !adultCatSlugs.has(c.slug as string))
    .map((c) => {
    const childSlugs = childrenMap.get(c.id as string) ?? [];
    const slugsToCheck = [c.slug as string, ...childSlugs];
    let cover: string | null = (c.image_url as string | null) ?? null;
    let count = 0;
    for (const s of slugsToCheck) {
      const arr = productsByCat.get(s) ?? [];
      count += arr.length;
      if (!cover && arr.length > 0) cover = arr[0];
    }
    return {
      slug: c.slug as string,
      name: c.name as string,
      description: (c.description as string | null) ?? null,
      imageUrl: cover,
      productsCount: count,
    };
  });
  return (
    <>
      {/* HERO — baner fullwidth LUB stary hero (gdy brak banerów) */}
      {activeBanners.length > 0 ? (
        <>
          <div className="md:-mt-[30px]">
            <BannerSlider banners={activeBanners} />
          </div>
          <section className="bg-muted border-b border-border">
            <div className="container mx-auto px-5 py-10 text-center sm:px-6 lg:px-10 xl:px-12">
              <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight text-balance sm:text-[2.6rem] md:text-[2.8rem] lg:text-[3.4rem] xl:text-[4.2rem] [word-break:keep-all] [overflow-wrap:normal]">
                Wredny kubek — Prezent z charakterem
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
                Twój własny styl bez owijania w bawełnę.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/sklep">
                  <Button size="lg" className="h-12 px-6 text-base bg-teal-500 text-white hover:bg-teal-600 sm:h-11 sm:px-5 sm:text-sm">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Zobacz sklep
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="bg-muted">
          <div className="container mx-auto grid items-center gap-8 px-5 py-12 sm:px-6 md:grid-cols-2 md:gap-12 md:py-16 lg:gap-16 lg:px-10 xl:px-12">
            <div className="min-w-0">
              <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight text-balance sm:text-[2.6rem] md:text-[2.8rem] lg:text-[3.4rem] xl:text-[4.2rem] [word-break:keep-all] [overflow-wrap:normal]">
                Wredny kubek<br />Prezent z charakterem
              </h1>
              <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
                Twój własny styl bez owijania w bawełnę.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/sklep">
                  <Button size="lg" className="h-12 px-6 text-base bg-teal-500 text-white hover:bg-teal-600 sm:h-11 sm:px-5 sm:text-sm">
                    Zobacz sklep
                  </Button>
                </Link>
              </div>
            </div>
            <HeroSlideshow />
          </div>
        </section>
      )}

      <HeroSearch />

      {/* CECHY — DARMOWA DOSTAWA, CZAS REALIZACJI, JAKOŚĆ PREMIUM, BEZPIECZNE PŁATNOŚCI */}
      <section className="bg-background py-8 sm:py-10">
        <div className="container mx-auto px-5 sm:px-6 lg:px-10 xl:px-12">
          <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm sm:px-8 sm:py-6">
            <div className="grid grid-cols-2 divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
              {/* Darmowa dostawa */}
              <div className="flex items-center gap-4 py-4 md:py-0 md:px-6 first:pl-0 last:pr-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="#11C2BB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="22" width="40" height="22" rx="2" />
                    <path d="M42 30h10l8 8v8H42V30z" />
                    <circle cx="16" cy="48" r="5" />
                    <circle cx="50" cy="48" r="5" />
                    <path d="M2 22l6-10h28l6 10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Darmowa dostawa</p>
                  <p className="text-xs text-muted-foreground">od 200 zł w całej Polsce</p>
                </div>
              </div>

              {/* Czas realizacji */}
              <div className="flex items-center gap-4 py-4 md:py-0 md:px-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="#11C2BB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="32" cy="34" r="22" />
                    <path d="M32 18v16l10 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Szybka realizacja</p>
                  <p className="text-xs text-muted-foreground">1–14 dni roboczych</p>
                </div>
              </div>

              {/* Jakość premium */}
              <div className="flex items-center gap-4 py-4 md:py-0 md:px-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="#11C2BB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M32 6l8 14 16 2-12 11 3 16-15-8-15 8 3-16L8 22l16-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Jakość premium</p>
                  <p className="text-xs text-muted-foreground">trwały nadruk na lata</p>
                </div>
              </div>

              {/* Bezpieczne płatności */}
              <div className="flex items-center gap-4 py-4 md:py-0 md:px-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="#11C2BB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="14" width="56" height="36" rx="4" />
                    <path d="M4 26h56" />
                    <rect x="8" y="32" width="14" height="8" rx="2" fill="#11C2BB" stroke="none" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Bezpieczne płatności</p>
                  <p className="text-xs text-muted-foreground">Karta · BLIK · Stripe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE — ruchomy pasek tekstowy */}
      <div className="overflow-hidden">
        <Marquee />
      </div>

      {/* WREDNE HITY — polecane przez admina */}
      {featuredProducts.length > 0 && (
        <section className="bg-background">
          <div className="container mx-auto px-5 py-14 sm:px-6 md:py-20 lg:px-10 xl:px-12">
            <div className="mb-8 flex flex-col items-start gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-500">
                  ⭐ Wredne Hity
                </span>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  Ulubieńcy naszych klientów
                </h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Ręcznie wybrane przez nas — kubki, które zamawiają najczęściej
                  i wracają po więcej.
                </p>
              </div>
              <Link
                href="/sklep"
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Zobacz wszystkie →
              </Link>
            </div>
            <ProductCarousel products={featuredProducts} />
          </div>
        </section>
      )}

      {/* BESTSELLERY — produkty z etykietą "bestseller" (panel admina) */}
      {bestsellerProducts.length > 0 && (
        <section className="bg-background border-t border-border">
          <div className="container mx-auto px-5 py-14 sm:px-6 md:py-20 lg:px-10 xl:px-12">
            <div className="mb-8 flex flex-col items-start gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-500">
                  🔥 Bestsellery
                </span>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  Najchętniej kupowane
                </h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Liderzy sprzedaży — kubki, które wybieracie najczęściej.
                </p>
              </div>
              <Link
                href="/sklep"
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Zobacz wszystkie →
              </Link>
            </div>
            <ProductCarousel products={bestsellerProducts} />
          </div>
        </section>
      )}

      {/* SEKCJA TIKTOK — karuzela filmów (renderuje się tylko gdy są aktywne filmy) */}
      <TikTokSection />

      {/* BANER ALLEGRO */}
      <section className="bg-background pb-14 md:pb-20">
        <div className="container mx-auto px-5 sm:px-6 lg:px-10 xl:px-12">
          <a
            href="https://allegrolokalnie.pl/uzytkownik/Client:126072599"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden rounded-3xl border border-[#FF5A00]/30 bg-gradient-to-r from-[#FF5A00] via-[#ff7a2a] to-[#ffb152] p-6 shadow-md transition hover:shadow-xl sm:p-8"
          >
            <div
              aria-hidden
              className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl"
            />
            <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/95 text-[#FF5A00] shadow-sm sm:h-16 sm:w-16">
                  <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="text-white">
                  <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                    Allegro Lokalnie
                  </span>
                  <h3 className="mt-2 text-xl font-extrabold leading-tight sm:text-2xl md:text-3xl">
                    Wolisz kupić na Allegro?
                  </h3>
                  <p className="mt-1 max-w-xl text-sm text-white/90 sm:text-base">
                    Nasze kubki znajdziesz też na Allegro Lokalnie — z opcją
                    odbioru w paczkomacie InPost i znanymi metodami płatności.
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#FF5A00] shadow transition group-hover:scale-[1.03] sm:text-base">
                Sprawdź Allegro
                <span aria-hidden>→</span>
              </span>
            </div>
          </a>
        </div>
      </section>

      {/* KARUZELA KATEGORII */}
      {categoryCards.length > 0 && (
        <section className="bg-[#e4efec] dark:bg-[#1a2e29] border-t border-border">
          <div className="container mx-auto px-5 py-14 sm:px-6 md:py-16 lg:px-10 xl:px-12">
            <div className="mb-8 flex flex-col items-start gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Kategorie
                </span>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  Wybierz swoją tematykę
                </h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Od popkultury po zodiak — znajdź kubek idealny dla siebie lub
                  na prezent.
                </p>
              </div>
              <Link
                href="/sklep"
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Zobacz sklep →
              </Link>
            </div>
            <CategoryCarousel categories={categoryCards} />
          </div>
        </section>
      )}

      {/* KARUZELA PRODUKTÓW */}
      <section className="bg-background">
        <div className="container mx-auto px-5 py-14 sm:px-6 md:py-20 lg:px-10 xl:px-12">
          <div className="mb-8 flex flex-col items-start gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Hit zamówień
              </span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                Kubki, które rozkochują od pierwszego łyka
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Sprawdź nasze najpopularniejsze projekty — gotowe pomysły na
                prezent, idealne na urodziny, rocznicę albo „bez okazji".
              </p>
            </div>
            <Link
              href="/sklep"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Zobacz wszystkie →
            </Link>
          </div>
          <ProductCarousel products={products} />
        </div>
      </section>

      {/* PROMO – jeden produkt: kubek */}
      <section className="bg-gradient-to-b from-background to-[#e6faf5]">
        <div className="container mx-auto grid items-center gap-10 px-5 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-10 xl:px-12">
          <div className="order-2 md:order-1">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Twój kubek, Twój styl
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Stwórz wymarzony kubek — dla siebie lub w prezencie
            </h2>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              Zaprojektuj unikalny kubek w kilka minut: dodaj zdjęcie, napis,
              ulubiony cytat. Idealny pomysł na prezent dla bliskiej osoby,
              pamiątkę z ważnej chwili albo codzienną dawkę dobrego humoru
              przy porannej kawie.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground sm:text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 flex-none rounded-full bg-primary" />
                Wysokiej jakości nadruk sublimacyjny — kolory zostają na lata
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 flex-none rounded-full bg-primary" />
                Personalizacja w prostym edytorze — bez wiedzy graficznej
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 flex-none rounded-full bg-primary" />
                Szybka realizacja i wysyłka prosto pod drzwi
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/edytor?product=mug">
                <Button size="lg">Zaprojektuj swój kubek</Button>
              </Link>
              <Link href="/sklep">
                <Button size="lg" variant="outline">
                  Pomysły na prezent
                </Button>
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative mx-auto aspect-square w-full max-w-md">
              {/* miękki cień / poświata pod kubkiem */}
              <div
                aria-hidden
                className="absolute inset-x-8 bottom-6 top-1/2 rounded-[50%] bg-black/40 blur-3xl"
              />
              <Image
                src="/kubek_merch.png"
                alt="Personalizowany kubek ceramiczny"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="relative object-contain drop-shadow-[0_25px_30px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
