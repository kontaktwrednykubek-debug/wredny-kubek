import { BackLink } from "@/components/BackLink";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Nowy produkt" };

export default function NewProductPage({
  params,
}: {
  params: { adminSlug: string };
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink
        href={`/${params.adminSlug}/produkty`}
        label="Wróć do listy produktów"
      />
      <div>
        <h1 className="text-2xl font-bold">Nowy produkt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wypełnij formularz, aby dodać produkt do sklepu. Zdjęcia zostaną
          przesłane do bezpiecznego magazynu Supabase.
        </p>
      </div>
      <ProductForm adminSlug={params.adminSlug} mode="create" />
    </div>
  );
}
