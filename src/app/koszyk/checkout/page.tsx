import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CheckoutClient, type CheckoutShippingMethod } from "./CheckoutClient";

export const metadata = { title: "Zamówienie" };

export default async function CheckoutPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shipping_methods")
    .select(
      "code, name, description, price_grosze, requires_parcel_code, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const methods: CheckoutShippingMethod[] = (data ?? []).map((m) => ({
    code: m.code as string,
    name: m.name as string,
    description: m.description as string,
    priceGrosze: m.price_grosze as number,
    requiresParcelCode: Boolean(m.requires_parcel_code),
  }));

  return <CheckoutClient methods={methods} />;
}
