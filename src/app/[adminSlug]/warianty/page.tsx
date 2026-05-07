import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WariantyAdmin, type CupColorVariant } from "./WariantyAdmin";

export const metadata = { title: "Warianty kubków" };

export default async function WariantyPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("cup_color_variants")
    .select("id, name, image_url, sort_order, stock_count")
    .order("sort_order", { ascending: true });

  const variants: CupColorVariant[] = (data ?? []).map((v) => ({
    id: v.id as string,
    name: v.name as string,
    image_url: (v.image_url as string | null) ?? null,
    sort_order: (v.sort_order as number) ?? 100,
    stock_count: (v.stock_count as number) ?? 0,
  }));

  return <WariantyAdmin variants={variants} />;
}
