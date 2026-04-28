import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Twoje konto" };

export default async function AccountPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  return (
    <section className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Witaj, {user.email}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Twoje zamówienia</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Brak zamówień.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Zapisane projekty</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Brak zapisanych projektów.
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
