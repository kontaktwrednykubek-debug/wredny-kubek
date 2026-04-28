import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/features/catalog/ProductGallery";
import { brand } from "@/config/theme";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-muted">
        <div className="container mx-auto grid items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Stwórz swój własny merch!
            </h1>
            <p className="mt-4 max-w-lg text-muted-foreground">
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
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 via-accent/40 to-primary/10 p-6 shadow-inner">
            <div className="grid h-full grid-cols-3 gap-3">
              {["☕", "👕", "📓", "🔑", "🎒", "🧢"].map((e, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-xl bg-card text-3xl shadow-sm"
                >
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProductGallery />

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
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
