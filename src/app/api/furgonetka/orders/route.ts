import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/furgonetka/orders
 *
 * Endpoint integracyjny dla Furgonetka.pl. Furgonetka pobiera listę zamówień,
 * autoryzując się tokenem Bearer w nagłówku Authorization.
 *
 * Konfiguracja w panelu Furgonetki:
 *   Adres URL: https://twojadomena.pl/api/furgonetka
 *   (Furgonetka sama dopisuje /orders, /order/{id}, /shipments itd.)
 *   Token: wartość zmiennej środowiskowej FURGONETKA_API_TOKEN
 *
 * Bez tokenu zwraca 401. Z poprawnym tokenem zwraca listę zamówień ze
 * statusem PENDING/PAID/IN_PRODUCTION (czyli te oczekujące na wysyłkę).
 */
export async function GET(request: Request) {
  const expected = process.env.FURGONETKA_API_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "FURGONETKA_API_TOKEN not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return new NextResponse("Brak autoryzacji", { status: 401 });
  }

  // Furgonetka oczekuje listy zamówień. Zwracamy te oczekujące na wysyłkę.
  // Używamy sesji anon — w produkcji warto przełączyć na klienta z service-role
  // i odpytywać przez wybrane statusy.
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, amount_grosze, currency, status, created_at, quantity, shipping_info",
    )
    .in("status", ["PENDING", "PAID", "IN_PRODUCTION"])
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { orders: [], total: 0, error: error.message },
      { status: 200 },
    );
  }

  const orders = (data ?? []).map((o) => ({
    id: o.id,
    external_id: o.id,
    status: o.status,
    created_at: o.created_at,
    currency: o.currency ?? "PLN",
    total_amount: (o.amount_grosze ?? 0) / 100,
    quantity: o.quantity ?? 1,
    recipient: o.shipping_info ?? null,
  }));

  return NextResponse.json({
    orders,
    total: orders.length,
  });
}
