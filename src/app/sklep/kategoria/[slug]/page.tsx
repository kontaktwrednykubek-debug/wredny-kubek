import type { Metadata } from "next";
import { ShopView, categoryMetadata, type ShopSearchParams } from "../../ShopView";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return categoryMetadata(params.slug);
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: ShopSearchParams;
}) {
  return <ShopView category={params.slug} searchParams={searchParams} />;
}
