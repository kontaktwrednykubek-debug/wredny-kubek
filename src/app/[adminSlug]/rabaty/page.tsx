import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DiscountCodesAdmin } from "./DiscountCodesAdmin";
import type { DiscountCode } from "@/lib/discount/types";

export const metadata = { title: "Rabaty / Zniżki" };

export default async function DiscountCodesAdminPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rabaty / Zniżki</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zarządzaj kodami rabatowymi: procentowe, kwotowe i darmowa dostawa.
          Kody są synchronizowane ze Stripe (oprócz darmowej dostawy, która
          jest obsługiwana po stronie sklepu).
        </p>
      </div>
      <DiscountCodesAdmin initialCodes={(data ?? []) as DiscountCode[]} />
    </div>
  );
}
