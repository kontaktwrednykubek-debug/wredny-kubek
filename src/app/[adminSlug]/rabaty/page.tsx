import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { DiscountCodesAdmin } from "./DiscountCodesAdmin";
import { PromotionsAdmin, type Promotion } from "./PromotionsAdmin";
import { MysteryMugAdmin, type MysteryMug } from "./MysteryMugAdmin";
import { ScratchCardsAdmin, type ScratchBatchWithStats } from "./ScratchCardsAdmin";
import type { DiscountCode, ScratchBatch } from "@/lib/discount/types";

export const metadata = { title: "Rabaty / Zniżki" };

export default async function DiscountCodesAdminPage() {
  const supabase = createSupabaseServerClient();
  const serviceSupabase = createSupabaseServiceClient();

  const [codesRes, { data: promos }, { data: mysteryMug }, { data: rawBatches }] = await Promise.all([
    // Zwykłe kody (bez zdrapek — te mają własną sekcję).
    supabase
      .from("discount_codes")
      .select("*")
      .is("scratch_batch_id", null)
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
    supabase
      .from("scratch_batches")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  // Fallback, gdy migracja 0023 (kolumna scratch_batch_id) nie jest jeszcze wgrana.
  let codes = codesRes.data;
  if (codesRes.error) {
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    codes = data;
  }

  // Liczniki kodów (wszystkie / użyte) dla każdej puli zdrapek.
  const batches: ScratchBatchWithStats[] = await Promise.all(
    ((rawBatches ?? []) as ScratchBatch[]).map(async (b) => {
      const [{ count: total }, { count: used }] = await Promise.all([
        supabase
          .from("discount_codes")
          .select("id", { count: "exact", head: true })
          .eq("scratch_batch_id", b.id),
        supabase
          .from("discount_codes")
          .select("id", { count: "exact", head: true })
          .eq("scratch_batch_id", b.id)
          .gt("times_used", 0),
      ]);
      return { ...b, total: total ?? 0, used: used ?? 0 };
    }),
  );

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

      {/* Sekcja rabatów zdrapek */}
      <ScratchCardsAdmin initialBatches={batches} />

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
