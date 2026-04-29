import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/BackLink";
import { SavedDesignsClient } from "./SavedDesignsClient";

export const metadata = { title: "Zapisane projekty" };

export default async function SavedDesignsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/projekty");

  const { data: designs } = await supabase
    .from("designs")
    .select("id, product_id, preview_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="container mx-auto max-w-5xl px-4 py-8">
      <BackLink href="/account" label="Wróć do panelu" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Zapisane projekty</h1>
        <Link href="/edytor">
          <Button>
            <Plus className="h-4 w-4" />
            Nowy projekt
          </Button>
        </Link>
      </div>
      <SavedDesignsClient designs={designs ?? []} />
    </section>
  );
}
