import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ReviewsClient, StarRow, type Review } from "@/features/reviews/ReviewsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Opinie klientów | Wredny Kubek",
  description: "Zobacz, co mówią o nas ludzie, którzy już zaryzykowali. Dodaj swoją opinię o Wrednym Kubku.",
};

export default async function OpiniePage() {
  noStore(); // zawsze świeże opinie (bez cache danych Next.js)
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("id, author_name, rating, body, image_url, created_at")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });
  const reviews = (data ?? []) as Review[];

  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  return (
    <>
      <header className="bg-muted">
        <div className="container mx-auto px-5 py-10 sm:px-6 lg:px-10 xl:px-12">
          <h1 className="text-3xl font-bold tracking-tight">Opinie klientów</h1>
          <p className="mt-2 text-muted-foreground">
            <strong className="font-bold text-foreground">Niezdecydowany? No bez jaj.</strong>{" "}
            Oto co mówią ludzie, którzy już zaryzykowali.
          </p>
          {count > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <StarRow value={Math.round(avg)} size={18} />
              <span className="text-sm text-muted-foreground">
                {avg.toFixed(1)} · {count} {count === 1 ? "opinia" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? "opinie" : "opinii"}
              </span>
            </div>
          )}
        </div>
      </header>

      <section className="container mx-auto px-5 py-10 sm:px-6 lg:px-10 xl:px-12">
        <ReviewsClient reviews={reviews} />
      </section>
    </>
  );
}
