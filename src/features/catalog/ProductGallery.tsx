import Link from "next/link";
import { productList } from "@/config/products";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function ProductGallery() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl">
        Produkty do personalizacji
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {productList.map((p) => (
          <Link
            key={p.id}
            href={`/edytor?product=${p.id}`}
            className="group"
          >
            <Card className="overflow-hidden transition-transform group-hover:-translate-y-1 group-hover:shadow-lg">
              <div
                className="relative flex aspect-[4/3] items-center justify-center"
                style={{ background: p.sceneBg }}
              >
                <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Kliknij, aby zaprojektować
                </span>
                <span className="text-5xl">
                  {p.id === "mug" && "☕"}
                  {p.id === "tshirt" && "👕"}
                  {p.id === "notebook" && "📓"}
                  {p.id === "keychain" && "🔑"}
                </span>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Pole nadruku: {p.canvas.widthMm}×{p.canvas.heightMm} mm
                  </p>
                </div>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(p.basePrice)}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
