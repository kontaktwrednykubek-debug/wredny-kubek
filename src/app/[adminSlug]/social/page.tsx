import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SocialAdmin, type AdminProduct } from "./SocialAdmin";

export const metadata = { title: "TikTok / Social media" };

export default async function SocialPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("shop_products")
    .select("slug, title, price_grosze, images")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">TikTok / Social media</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wklej link do filmu z TikToka — okładka pobierze się automatycznie i
          zapisze na stałe. Możesz powiązać produkty, które pojawią się pod
          filmem z przyciskiem „Kup".
        </p>
      </div>
      <SocialAdmin products={(data ?? []) as AdminProduct[]} />
    </div>
  );
}
