import { ProductGallery } from "@/features/catalog/ProductGallery";

export const metadata = { title: "Sklep" };

export default function ShopPage() {
  return (
    <>
      <header className="bg-muted">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Sklep</h1>
          <p className="mt-2 text-muted-foreground">
            Wszystkie produkty dostępne do personalizacji.
          </p>
        </div>
      </header>
      <ProductGallery />
    </>
  );
}
