import { permanentRedirect } from "next/navigation";
import { ShopView, type ShopSearchParams } from "./ShopView";

export const metadata = { title: "Sklep" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: ShopSearchParams & { category?: string };
}) {
  // Zgodność wsteczna + SEO: stary adres /sklep?category=xxx przekierowujemy
  // (308) na czysty /sklep/kategoria/xxx, zachowując pozostałe parametry.
  if (searchParams?.category) {
    const { category, ...rest } = searchParams;
    const qs = new URLSearchParams(
      Object.entries(rest).filter(([, v]) => v != null) as [string, string][],
    ).toString();
    permanentRedirect(`/sklep/kategoria/${category}${qs ? `?${qs}` : ""}`);
  }

  return <ShopView category={null} searchParams={searchParams} />;
}
