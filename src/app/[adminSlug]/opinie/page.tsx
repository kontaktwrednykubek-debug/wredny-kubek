import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ReviewsAdminClient } from "./ReviewsAdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opinie" };

export default async function AdminReviewsPage() {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("product_reviews")
    .select("id, product_slug, author_name, rating, body, image_url, is_approved, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Opinie klientów</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Zatwierdź lub usuń opinie przed ich publikacją na stronie.
        </p>
      </div>
      <ReviewsAdminClient initialReviews={data ?? []} />
    </div>
  );
}
