import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CheckoutClient,
  type CheckoutShippingMethod,
  type ShippingCountry,
} from "./CheckoutClient";

export const metadata = { title: "Zamówienie" };

export default async function CheckoutPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? null;

  const [{ data }, { data: countriesRaw }, { data: countryMethods }] = await Promise.all([
    supabase
      .from("shipping_methods")
      .select(
        "code, name, description, price_grosze, free_shipping_threshold_grosze, requires_parcel_code, sort_order, shipping_method_tiers(id, min_quantity, price_grosze)",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("shipping_countries")
      .select("id, code, name, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("shipping_country_methods")
      .select("id, country_id, name, carrier, price_grosze, requires_parcel_code, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const methods: CheckoutShippingMethod[] = (data ?? []).map((m) => ({
    code: m.code as string,
    name: m.name as string,
    description: m.description as string,
    priceGrosze: m.price_grosze as number,
    freeShippingThresholdGrosze: (m.free_shipping_threshold_grosze as number | null) ?? null,
    requiresParcelCode: Boolean(m.requires_parcel_code),
    tiers: (
      (m.shipping_method_tiers as { id: string; min_quantity: number; price_grosze: number }[]) ?? []
    ).sort((a, b) => a.min_quantity - b.min_quantity),
  }));

  const countries: ShippingCountry[] = (countriesRaw ?? [])
    .map((c) => ({
      id: c.id as string,
      code: c.code as string,
      name: c.name as string,
      methods: (countryMethods ?? [])
        .filter((m) => m.country_id === c.id)
        .map((m) => ({
          id: m.id as string,
          name: m.name as string,
          priceGrosze: m.price_grosze as number,
          requiresParcelCode: Boolean(m.requires_parcel_code),
        })),
    }))
    .filter((c) => c.methods.length > 0);

  return <CheckoutClient methods={methods} countries={countries} userEmail={userEmail} />;
}
