import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Star, ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { WishlistButton } from "@/components/WishlistButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ulubione" };

export default async function WishlistPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/ulubione");

  const { data: wishlistItems } = await supabase
    .from("wishlists")
    .select("product_slug")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const slugs = (wishlistItems ?? []).map((w) => w.product_slug);

  const { data: products } = slugs.length
    ? await supabase
        .from("shop_products")
        .select("slug, title, price_grosze, images, rating, reviews_count")
        .in("slug", slugs)
        .eq("is_published", true)
    : { data: [] };

  return (
    <section className="container mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do konta
      </Link>

      <h1 className="mb-1 text-3xl font-bold">Ulubione</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Produkty, które polubiłeś/-aś.
      </p>

      {!products || products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Brak ulubionych produktów.</p>
          <Link
            href="/sklep"
            className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Przejdź do sklepu →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {products.map((p) => {
            const cover = (p.images as string[])?.[0];
            return (
              <Link
                key={p.slug as string}
                href={`/sklep/${p.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary hover:shadow-md"
              >
                <div className="relative aspect-square bg-muted">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={p.title as string}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      unoptimized
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                      brak zdjęcia
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <WishlistButton slug={p.slug as string} initialSaved />
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 font-semibold">{p.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(p.price_grosze as number)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(p.rating).toFixed(1)} ({p.reviews_count})
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
