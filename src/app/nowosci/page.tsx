import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ProductCarousel,
  type CarouselProduct,
} from "@/features/catalog/ProductCarousel";

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
    .limit(20);

  const products = (data ?? []) as CarouselProduct[];

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
        <ProductCarousel products={products} />
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
