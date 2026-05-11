import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileNameForm } from "./ProfileNameForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ustawienia konta" };

export default async function AccountSettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/ustawienia");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="container mx-auto max-w-md px-4 py-12">
      <Link
        href="/account"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do konta
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Ustawienia konta</h1>
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="mb-1 text-sm text-muted-foreground">Email</p>
        <p className="mb-5 font-medium">{user.email}</p>
        <ProfileNameForm currentName={profile?.full_name ?? ""} />
      </div>
    </section>
  );
}
