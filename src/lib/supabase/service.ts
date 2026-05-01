import { createClient } from "@supabase/supabase-js";

/**
 * Klient Supabase z service-role (omija RLS).
 * Używaj TYLKO w trusted server contexts (webhooki, cron, admin API).
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[supabase-service] Missing env vars", {
      hasUrl: !!url,
      hasKey: !!key,
      keyLength: key?.length ?? 0,
    });
    throw new Error("Missing Supabase service-role env vars.");
  }
  // Diagnostyka: poprawny service role JWT ma ~200+ znaków i zawiera "service_role"
  // (nie loguj samej wartości, tylko sygnaturę).
  if (key.length < 100) {
    console.warn(
      `[supabase-service] SUPABASE_SERVICE_ROLE_KEY ma podejrzanie krótką długość: ${key.length} znaków. Powinno być 200+.`,
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
