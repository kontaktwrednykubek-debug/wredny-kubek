import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Factory,
  Package,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Panel administratora" };

const PAID_STATUSES = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];

export default async function AdminDashboard({
  params,
}: {
  params: { adminSlug: string };
}) {
  const supabase = createSupabaseServerClient();

  // Granice czasu
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  // Równolegle wszystkie zapytania
  const [
    todayCountQ,
    monthOrdersQ,
    pendingCountQ,
    productionCountQ,
    shippedCountQ,
    profilesCountQ,
    productsCountQ,
    recentOrdersQ,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay),
    supabase
      .from("orders")
      .select("amount_grosze, status, created_at")
      .gte("created_at", startOfMonth),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "IN_PRODUCTION"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "SHIPPED"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("shop_products")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, product_id, amount_grosze, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthOrders = monthOrdersQ.data ?? [];
  const monthRevenue = monthOrders
    .filter((o) => PAID_STATUSES.includes(o.status))
    .reduce((s, o) => s + (o.amount_grosze ?? 0), 0);
  const recentOrders = recentOrdersQ.data ?? [];

  const base = `/${params.adminSlug}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Przegląd zamówień i kluczowe statystyki sklepu.
        </p>
      </div>

      {/* Główne KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Zamówienia (dzisiaj)"
          value={String(todayCountQ.count ?? 0)}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          label="Przychód (miesiąc)"
          value={formatPrice(monthRevenue)}
          highlight
        />
        <KpiCard
          icon={<Users className="h-5 w-5 text-primary" />}
          label="Użytkownicy"
          value={String(profilesCountQ.count ?? 0)}
        />
        <KpiCard
          icon={<Package className="h-5 w-5 text-amber-500" />}
          label="Produkty w sklepie"
          value={String(productsCountQ.count ?? 0)}
        />
      </div>

      {/* Statusy zamówień */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label="Oczekujące"
          value={pendingCountQ.count ?? 0}
          href={`${base}/zamowienia`}
        />
        <StatusCard
          icon={<Factory className="h-5 w-5 text-purple-500" />}
          label="W produkcji"
          value={productionCountQ.count ?? 0}
          href={`${base}/zamowienia`}
        />
        <StatusCard
          icon={<Truck className="h-5 w-5 text-indigo-500" />}
          label="Wysłane"
          value={shippedCountQ.count ?? 0}
          href={`${base}/zamowienia`}
        />
      </div>

      {/* Najnowsze zamówienia */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Najnowsze zamówienia</CardTitle>
          <Link
            href={`${base}/zamowienia`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Zobacz wszystkie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak zamówień. Pojawią się tutaj po pierwszej sprzedaży.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.product_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pl-PL")} · #
                      {o.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {o.status}
                    </span>
                    <span className="font-bold text-primary">
                      {formatPrice(o.amount_grosze)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        highlight ? "border-emerald-500/30 bg-emerald-500/5" : undefined
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary sm:text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
