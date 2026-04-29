import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, Palette, ChevronRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Twoje konto" };

export default async function AccountPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  // Liczby dla kafelków (RLS zwróci tylko własne rekordy).
  const [{ count: designsCount }, { count: ordersCount }] = await Promise.all([
    supabase
      .from("designs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <section className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-1 text-3xl font-bold">Witaj, {user.email}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Zarządzaj zamówieniami i zapisanymi projektami.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/account/zamowienia" className="group">
          <Card className="h-full transition group-hover:border-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Twoje zamówienia
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {ordersCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {ordersCount === 1 ? "zamówienie" : "zamówień"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/projekty" className="group">
          <Card className="h-full transition group-hover:border-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Zapisane projekty
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {designsCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {designsCount === 1 ? "projekt" : "projektów"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  );
}
