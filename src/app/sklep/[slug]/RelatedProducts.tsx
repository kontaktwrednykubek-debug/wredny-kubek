"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Product = {
  id: string;
  slug: string;
  title: string;
  price_grosze: number;
  images: unknown;
};

export function RelatedProducts({ slug }: { slug: string }) {
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    fetch(`/api/related-products/${slug}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {});
  }, [slug]);

  if (products.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="mb-5 text-xl font-bold tracking-tight">
        Inne wredne kubki, które mogą Cię rozbawić
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {products.map((p) => {
          const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
          const img = imgs[0] ?? null;
          return (
            <Link
              key={p.id}
              href={`/sklep/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
            >
              <div className="relative aspect-square bg-muted overflow-hidden">
                {img ? (
                  <Image
                    src={img}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">
                  {p.title}
                </p>
                <p className="text-sm font-bold text-primary">
                  {formatPrice(p.price_grosze)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
