import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ProductCarousel,
  type CarouselProduct,
} from "@/features/catalog/ProductCarousel";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data: carouselProducts } = await supabase
    .from("shop_products")
    .select("slug, title, price_grosze, images, rating, reviews_count")
    .eq("is_published", true)
    .neq("category", "merch")
    .order("created_at", { ascending: false })
    .limit(12);
  const products = (carouselProducts ?? []) as CarouselProduct[];
  return (
    <>
      {/* HERO */}
      <section className="bg-muted">
        <div className="container mx-auto grid items-center gap-8 px-5 py-12 sm:px-6 md:grid-cols-2 md:gap-12 md:py-16 lg:gap-16 lg:px-10 xl:px-12">
          <div className="min-w-0">
            <h1 className="break-words text-[2rem] font-extrabold leading-[1.05] tracking-tight hyphens-auto sm:text-[2.6rem] md:text-[2.8rem] lg:text-[3.4rem] xl:text-[4.2rem]">
              Spersonalizuj swój własny styl kubka
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              Personalizuj kubki, koszulki i wiele więcej. Zamów online,
              wydrukuj w domu lub u nas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/edytor">
                <Button size="lg">Rozpocznij projektowanie</Button>
              </Link>
              <Link href="/sklep">
                <Button size="lg" variant="outline">
                  Zobacz sklep
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-square w-full">
            <Image
              src="/kubki.png"
              alt="Personalizowane kubki"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="scale-110 object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.35)]"
            />
          </div>
        </div>
      </section>

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
      <section className="bg-background">
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

      {/* CTA */}
      <section className="container mx-auto px-5 py-16 text-center sm:px-6 lg:px-10 xl:px-12">
        <h2 className="text-2xl font-bold md:text-3xl">
          Gotowe wzory do inspiracji
        </h2>
        <p className="mt-2 text-muted-foreground">
          Skopiuj nasz pomysł albo stwórz coś od zera w {brand.name}.
        </p>
        <Link href="/edytor" className="mt-6 inline-block">
          <Button size="lg">Otwórz edytor</Button>
        </Link>
      </section>
    </>
  );
}
