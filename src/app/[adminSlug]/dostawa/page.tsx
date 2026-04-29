import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShippingMethodsAdmin } from "./ShippingMethodsAdmin";

export const metadata = { title: "Metody dostawy" };

export default async function ShippingAdminPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shipping_methods")
    .select(
      "id, code, name, description, price_grosze, requires_parcel_code, carrier, is_active, sort_order",
    )
    .order("sort_order", { ascending: true });

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
      <ShippingMethodsAdmin methods={data ?? []} />
    </div>
  );
}
