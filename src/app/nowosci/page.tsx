import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nowości",
  description: "Najnowsze kubki i gadżety w sklepie WrednyKubek.",
};

export default async function NowosciPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shop_products")
    .select("slug, title, price_grosze, images, rating, reviews_count")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(40);

  const products = data ?? [];

  return (
    <div className="container mx-auto px-5 py-14 sm:px-6 md:py-20 lg:px-10 xl:px-12">
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          🆕 Nowości
        </span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Świeżynki w sklepie
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Najnowsze projekty — prosto z pieca. Sprawdź co nowego pojawiło się w
          naszej kolekcji.
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {products.map((p) => {
            const imgs = Array.isArray(p.images) ? p.images : [];
            const cover = typeof imgs[0] === "string" ? imgs[0] : null;
            return (
              <Link
                key={p.slug}
                href={`/sklep/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">☕</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">{p.title}</p>
                  {(p.rating ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground">{'⭐'.repeat(Math.round(p.rating))} ({p.reviews_count ?? 0})</p>
                  )}
                  <p className="mt-auto text-sm font-bold text-primary">{formatPrice(p.price_grosze)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">Wkrótce pojawią się nowości. Wróć za chwilę!</p>
          <Link
            href="/sklep"
            className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Zobacz cały sklep →
          </Link>
        </div>
      )}
    </div>
  );
}
