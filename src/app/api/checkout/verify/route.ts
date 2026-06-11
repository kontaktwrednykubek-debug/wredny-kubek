import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email/sendOrderEmail";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * POST /api/checkout/verify
 *
 * Weryfikuje sesję Stripe i jeśli payment_status === "paid",
 * oznacza zamówienie jako PAID i wysyła email.
 * Wywoływane ze strony sukcesu po przekierowaniu od Stripe.
 */
export async function POST(req: Request) {
  const { sessionId, orderId } = await req.json().catch(() => ({}));

  if (!sessionId || !orderId) {
    return NextResponse.json({ error: "Missing sessionId or orderId" }, { status: 400 });
  }

  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  // Weryfikuj że sesja dotyczy tego zamówienia
  if (session.metadata?.orderId !== orderId) {
    return NextResponse.json({ error: "Session/order mismatch" }, { status: 403 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ paid: false });
  }

  const supabase = createSupabaseServiceClient();

  // Odczytaj WSZYSTKIE IDs z batcha ze Stripe metadata.
  const orderIdsRaw = session.metadata?.orderIds ?? orderId;
  const allOrderIds = orderIdsRaw.split(",").map((s: string) => s.trim()).filter(Boolean);

  // Pobierz wszystkie zamówienia z batcha.
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, status, amount_grosze, shipping_info, user_id, product_id, label, quantity, preview_url, discount_code_id, discount_grosze")
    .in("id", allOrderIds);

  if (!allOrders || allOrders.length === 0) {
    return NextResponse.json({ error: "Orders not found" }, { status: 404 });
  }

  const primaryOrder = allOrders.find((o) => o.id === orderId) ?? allOrders[0];

  // Atomowy update WSZYSTKICH zamówień z batcha — tylko jeśli PENDING.
  // Zapobiega wyścigu z webhook.
  const { data: updatedRows } = await supabase
    .from("orders")
    .update({ status: "PAID" })
    .in("id", allOrderIds)
    .eq("status", "PENDING")
    .select("id");

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json({ paid: true, alreadyUpdated: true });
  }

  // Zapisz użycie kodu rabatowego jeśli był użyty (z głównego zamówienia).
  if (primaryOrder.discount_code_id) {
    try {
      await supabase.from("discount_code_uses").insert({
        discount_code_id: primaryOrder.discount_code_id,
        user_id: primaryOrder.user_id,
        order_id: primaryOrder.id,
        discount_grosze: primaryOrder.discount_grosze ?? 0,
      });
      const { data: dc } = await supabase
        .from("discount_codes")
        .select("times_used")
        .eq("id", primaryOrder.discount_code_id)
        .maybeSingle();
      if (dc) {
        await supabase
          .from("discount_codes")
          .update({ times_used: (dc.times_used ?? 0) + 1 })
          .eq("id", primaryOrder.discount_code_id);
      }
    } catch (err) {
      console.error("[verify] discount code tracking failed:", err);
    }
  }

  // Wyślij jeden email potwierdzający ze WSZYSTKIMI pozycjami.
  try {
    const shipping = (primaryOrder.shipping_info ?? {}) as Record<string, string>;
    const profile = primaryOrder.user_id
      ? (await supabase.from("profiles").select("email, full_name").eq("id", primaryOrder.user_id).maybeSingle()).data
      : null;

    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? null;
    const to = profile?.email ?? shipping.email ?? customerEmail;

    if (to) {
      const { data: dcRow } = primaryOrder.discount_code_id
        ? await supabase.from("discount_codes").select("code, type").eq("id", primaryOrder.discount_code_id).maybeSingle()
        : { data: null };

      const freeShipping = (dcRow as { type?: string } | null)?.type === "free_shipping";
      const fullShipping = Number(shipping.shippingPriceGr ?? 0);
      const rawDiscount = primaryOrder.discount_grosze ?? 0;
      const itemsDiscount = freeShipping ? 0 : rawDiscount;
      const effectiveShipping = freeShipping ? 0 : fullShipping;
      const itemsAmount = allOrders.reduce((s, o) => s + (o.amount_grosze ?? 0), 0);
      const totalGr = Math.max(0, itemsAmount - itemsDiscount) + effectiveShipping;

      await sendOrderConfirmationEmail({
        to,
        orderId: primaryOrder.id,
        customerName: shipping.fullName ?? profile?.full_name ?? "Kliencie",
        items: allOrders.map((o) => ({
          productId: o.product_id,
          label: (o.label as string | null) ?? o.product_id,
          quantity: o.quantity ?? 1,
          unitPriceGr: (o.amount_grosze ?? 0) / Math.max(1, o.quantity ?? 1),
          previewUrl: o.preview_url,
        })),
        shipping: {
          fullName: shipping.fullName ?? "",
          address: shipping.address ?? "",
          city: shipping.city ?? "",
          zip: shipping.zip ?? "",
          phone: shipping.phone ?? "",
          methodName: shipping.shippingMethodName,
          parcelCode: shipping.parcelCode,
        },
        totalGr,
        shippingPriceGr: fullShipping,
        discountCode: (dcRow as { code?: string } | null)?.code ?? null,
        discountGrosze: rawDiscount > 0 ? rawDiscount : undefined,
        freeShipping,
      });

      // Powiadomienie dla admina
      await sendAdminNotificationEmail({
        orderId: primaryOrder.id,
        customerName: shipping.fullName ?? profile?.full_name ?? "Klient",
        customerEmail: to,
        customerPhone: shipping.phone,
        totalGr,
        items: allOrders.map((o) => ({
          name: (o.label as string | null) ?? o.product_id ?? "",
          quantity: o.quantity ?? 1,
        })),
        deliveryMethod: shipping.shippingMethodName ?? "Nieznana",
        shippingAddress: {
          street: shipping.address ?? "",
          city: shipping.city ?? "",
          postalCode: shipping.zip ?? "",
          extraInfo: shipping.parcelCode ? `Paczkomat: ${shipping.parcelCode}` : undefined,
        },
      });
    }
  } catch (err) {
    console.error("[verify] email sending failed:", err);
  }

  return NextResponse.json({ paid: true });
}
