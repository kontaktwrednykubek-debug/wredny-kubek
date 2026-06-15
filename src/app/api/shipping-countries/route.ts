import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

/**
 * GET /api/shipping-countries — publiczna lista aktywnych krajów zagranicznych
 * wraz z aktywnymi metodami wysyłki (do wyboru w checkoucie).
 */
export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data: countries, error } = await supabase
    .from("shipping_countries")
    .select("id, code, name, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !countries) return NextResponse.json({ countries: [] });

  const { data: methods } = await supabase
    .from("shipping_country_methods")
    .select(
      "id, country_id, name, carrier, price_grosze, requires_parcel_code, free_shipping_threshold_grosze, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const result = countries
    .map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      methods: (methods ?? [])
        .filter((m) => m.country_id === c.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          carrier: m.carrier,
          priceGrosze: m.price_grosze,
          requiresParcelCode: Boolean(m.requires_parcel_code),
          freeShippingThresholdGrosze: m.free_shipping_threshold_grosze ?? null,
        })),
    }))
    // kraj bez aktywnych metod nie ma sensu w checkoucie
    .filter((c) => c.methods.length > 0);

  return NextResponse.json({ countries: result });
}
