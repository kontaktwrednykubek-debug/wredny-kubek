import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductForm, type ProductInitial } from "../ProductForm";

export const metadata = { title: "Edytuj produkt" };

export default async function EditProductPage({
  params,
}: {
  params: { adminSlug: string; slug: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shop_products")
    .select(
      "slug, title, description, body, category, price_grosze, images, specs, variants, rating, reviews_count, show_variant_stock, variant_stock",
    )
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data) notFound();

  const initial: ProductInitial = {
    slug: data.slug,
    title: data.title,
    description: data.description ?? "",
    body: (data.body as string | null) ?? "",
    category: data.category ?? "merch",
    price_grosze: Number(data.price_grosze) || 0,
    images: (data.images as string[]) ?? [],
    specs: (data.specs as Record<string, string>) ?? {},
    variants: (data.variants as ProductInitial["variants"]) ?? {},
    rating: Number(data.rating) || 0,
    reviews_count: Number(data.reviews_count) || 0,
    show_variant_stock: Boolean(data.show_variant_stock),
    variant_stock: (data.variant_stock as Record<string, number>) ?? {},
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink
        href={`/${params.adminSlug}/produkty`}
        label="Wróć do listy produktów"
      />
      <div>
        <h1 className="text-2xl font-bold">Edytuj produkt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zmień dane produktu i zapisz, aby zaktualizować ofertę w sklepie.
        </p>
      </div>
      <ProductForm
        adminSlug={params.adminSlug}
        mode="edit"
        initial={initial}
      />
    </div>
  );
}
