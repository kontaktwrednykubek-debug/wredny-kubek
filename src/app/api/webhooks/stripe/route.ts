import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendOrderConfirmationEmail } from "@/lib/email/sendOrderEmail";

export const runtime = "nodejs";

/**
 * Webhook Stripe — odbiera `checkout.session.completed`,
 * oznacza powiązane zamówienie jako PAID i wysyła email potwierdzający.
 *
 * Wymaga ustawienia: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(secret);
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (err) {
    console.error("[stripe-webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  if (!orderId) {
    console.warn("[stripe-webhook] No orderId in session metadata");
    return NextResponse.json({ received: true });
  }

  const supabase = createSupabaseServiceClient();

  // Pobierz zamówienia (jedna sesja Stripe = jedno orderId, ale w bazie może być
  // wiele wierszy w `orders` ze wspólnym shipping_info — bierzemy wszystkie z user_id).
  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, user_id, product_id, quantity, amount_grosze, shipping_info, preview_url",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !orderRow) {
    console.error("[stripe-webhook] Order not found", orderId, orderErr);
    return NextResponse.json({ received: true });
  }

  // Oznacz jako PAID
  await supabase.from("orders").update({ status: "PAID" }).eq("id", orderId);

  // Pobierz email klienta z profilu (fallback do session)
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", orderRow.user_id)
    .maybeSingle();

  const to = profile?.email ?? customerEmail;
  if (!to) {
    console.warn("[stripe-webhook] No email to send to for order", orderId);
    return NextResponse.json({ received: true });
  }

  const shipping = (orderRow.shipping_info ?? {}) as Record<string, string>;

  try {
    await sendOrderConfirmationEmail({
      to,
      orderId: orderRow.id,
      customerName: shipping.fullName ?? profile?.full_name ?? "Kliencie",
      items: [
        {
          productId: orderRow.product_id,
          label: orderRow.product_id,
          quantity: orderRow.quantity ?? 1,
          unitPriceGr:
            (orderRow.amount_grosze ?? 0) / (orderRow.quantity ?? 1),
          previewUrl: orderRow.preview_url,
        },
      ],
      shipping: {
        fullName: shipping.fullName ?? "",
        address: shipping.address ?? "",
        city: shipping.city ?? "",
        zip: shipping.zip ?? "",
        phone: shipping.phone ?? "",
        methodName: shipping.shippingMethodName,
        parcelCode: shipping.parcelCode,
      },
      totalGr:
        (orderRow.amount_grosze ?? 0) +
        Number(shipping.shippingPriceGr ?? 0),
      shippingPriceGr: Number(shipping.shippingPriceGr ?? 0),
    });
  } catch (err) {
    console.error("[stripe-webhook] sendOrderConfirmationEmail failed:", err);
    // Nie blokuj webhooka błędem maila
  }

  return NextResponse.json({ received: true });
}
