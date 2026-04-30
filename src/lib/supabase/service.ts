import { createClient } from "@supabase/supabase-js";

/**
 * Klient Supabase z service-role (omija RLS).
 * Używaj TYLKO w trusted server contexts (webhooki, cron, admin API).
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service-role env vars.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
