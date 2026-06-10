import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShippingMethodsAdmin, type ShippingMethodRow } from "./ShippingMethodsAdmin";

export const metadata = { title: "Metody dostawy" };

export default async function ShippingAdminPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shipping_methods")
    .select(
      "id, code, name, description, price_grosze, free_shipping_threshold_grosze, requires_parcel_code, carrier, is_active, sort_order, shipping_method_tiers(id, min_quantity, price_grosze)",
    )
    .order("sort_order", { ascending: true });

  const methods: ShippingMethodRow[] = (data ?? []).map((m) => ({
    id: m.id as string,
    code: m.code as string,
    name: m.name as string,
    description: m.description as string,
    price_grosze: m.price_grosze as number,
    free_shipping_threshold_grosze: (m.free_shipping_threshold_grosze as number | null) ?? null,
    requires_parcel_code: Boolean(m.requires_parcel_code),
    carrier: (m.carrier as string | null) ?? null,
    is_active: Boolean(m.is_active),
    sort_order: m.sort_order as number,
    tiers: (
      (m.shipping_method_tiers as { id: string; min_quantity: number; price_grosze: number }[]) ?? []
    ).sort((a, b) => a.min_quantity - b.min_quantity),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metody dostawy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zarządzaj sposobami dostawy widocznymi w koszyku. Wyłączone metody
          (toggle „Aktywna") znikają z checkoutu, ale historia zamówień się
          zachowuje.
        </p>
      </div>
      <ShippingMethodsAdmin methods={methods} />
    </div>
  );
}
