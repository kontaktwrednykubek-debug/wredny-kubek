import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { DiscountCodesAdmin } from "./DiscountCodesAdmin";
import { PromotionsAdmin, type Promotion } from "./PromotionsAdmin";
import { MysteryMugAdmin, type MysteryMug } from "./MysteryMugAdmin";
import type { DiscountCode } from "@/lib/discount/types";

export const metadata = { title: "Rabaty / Zniżki" };

export default async function DiscountCodesAdminPage() {
  const supabase = createSupabaseServerClient();
  const serviceSupabase = createSupabaseServiceClient();

  const [{ data: codes }, { data: promos }, { data: mysteryMug }] = await Promise.all([
    supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false }),
    serviceSupabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: true }),
    serviceSupabase
      .from("mystery_mug_config")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Rabaty / Zniżki</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zarządzaj kodami rabatowymi i automatycznymi promocjami koszykowymi.
        </p>
      </div>

      {/* Sekcja promocji automatycznych */}
      <PromotionsAdmin initialPromotions={(promos ?? []) as Promotion[]} />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Sekcja Kubek w ciemno (upsell) */}
      <MysteryMugAdmin initial={(mysteryMug ?? null) as MysteryMug | null} />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Sekcja kodów rabatowych */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Kody rabatowe</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kody procentowe, kwotowe i darmowa dostawa. Synchronizowane ze Stripe.
          </p>
        </div>
        <DiscountCodesAdmin initialCodes={(codes ?? []) as DiscountCode[]} />
      </div>
    </div>
  );
}
