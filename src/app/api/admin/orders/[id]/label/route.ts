import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/orders/[id]/label
 *
 * Tworzy zlecenie wygenerowania etykiety wysyłkowej dla zamówienia.
 *
 * MVP — bez bezpośredniej integracji z Furgonetka API:
 *   - Zapisuje status REQUESTED + carrier + timestamp w `orders`.
 *   - Zwraca URL panelu Furgonetki + dane potrzebne do stworzenia etykiety.
 *   - Admin pobiera etykietę z Furgonetki manualnie i wraca tu z numerem listu.
 *
 * Pełna integracja (auto-generacja PDF) będzie wymagała OAuth Furgonetki +
 * mapowania `shipping_carrier` na konkretne `service_id` Furgonetki.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Pobierz zamówienie.
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select(
      "id, status, shipping_info, shipping_carrier, shipping_label_url, shipping_tracking_number",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (fetchErr || !order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Aktualizacja statusu etykiety.
  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      shipping_label_status: "REQUESTED",
      shipping_requested_at: new Date().toISOString(),
    })
    .eq("id", params.id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: "REQUESTED",
    carrier: order.shipping_carrier,
    furgonetkaPanelUrl: "https://furgonetka.pl/panel",
    note:
      "Etykieta zostanie wygenerowana w Furgonetce na podstawie danych zamówienia. " +
      "Po jej pobraniu uzupełnij numer listu przewozowego w panelu admina.",
    shipping: order.shipping_info,
  });
}
