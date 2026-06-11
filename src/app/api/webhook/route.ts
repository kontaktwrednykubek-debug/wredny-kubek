import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email/sendOrderEmail";

export const runtime = "nodejs";

/**
 * Webhook Stripe — odbiera `checkout.session.completed`,
 * oznacza powiązane zamówienie jako PAID i wysyła email potwierdzający.
 *
 * Endpoint: POST /api/webhook
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

  // Diagnostyka konfiguracji środowiska (logujemy tylko fakt obecności + długości)
  console.log("[stripe-webhook] env check", {
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleKeyLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyLen: process.env.RESEND_API_KEY?.length ?? 0,
  });

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;
  // Wszystkie ID z jednego koszyka (zapisane przy tworzeniu sesji).
  const orderIdsRaw = session.metadata?.orderIds ?? orderId ?? "";
  const allOrderIds = orderIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  if (!orderId || allOrderIds.length === 0) {
    console.warn("[stripe-webhook] No orderId in session metadata");
    return NextResponse.json({ received: true });
  }

  const supabase = createSupabaseServiceClient();

  // Pobierz WSZYSTKIE zamówienia z batcha.
  const { data: allOrderRows, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, user_id, product_id, label, variant_color, quantity, amount_grosze, shipping_info, preview_url, discount_code_id, discount_grosze",
    )
    .in("id", allOrderIds);

  if (orderErr || !allOrderRows || allOrderRows.length === 0) {
    console.error("[stripe-webhook] Orders not found", allOrderIds, orderErr);
    return NextResponse.json({ received: true });
  }

  const primaryOrder = allOrderRows.find((o) => o.id === orderId) ?? allOrderRows[0];

  // Atomowy update WSZYSTKICH zamówień z batcha — tylko jeśli PENDING.
  // Zapobiega duplikatowi z /verify: zwracamy ile wierszy faktycznie zaktualizowaliśmy.
  const { data: updatedRows } = await supabase
    .from("orders")
    .update({ status: "PAID" })
    .in("id", allOrderIds)
    .eq("status", "PENDING")
    .select("id");

  if (!updatedRows || updatedRows.length === 0) {
    console.log("[stripe-webhook] All orders already PAID (verify was first), skipping email", allOrderIds);
    return NextResponse.json({ received: true });
  }

  console.log("[stripe-webhook] Marked PAID:", updatedRows.map((r) => r.id));
  
  // Stan magazynowy został już zdekrementowany atomowo w /api/orders przy tworzeniu zamówienia

  // Jeśli użyto kodu rabatowego — zapisz użycie i zainkrementuj licznik.
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
      console.error("[stripe-webhook] discount code usage tracking failed:", err);
    }
  }

  // Pobierz email klienta z profilu (tylko gdy zalogowany), inaczej z shipping_info / Stripe.
  const shippingInfoEarly = (primaryOrder.shipping_info ?? {}) as Record<string, string>;
  const profile = primaryOrder.user_id
    ? (
        await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", primaryOrder.user_id)
          .maybeSingle()
      ).data
    : null;

  const to = profile?.email ?? shippingInfoEarly.email ?? customerEmail;
  if (!to) {
    console.warn("[stripe-webhook] No email to send to for order", orderId);
    return NextResponse.json({ received: true });
  }

  const shipping = (primaryOrder.shipping_info ?? {}) as Record<string, string>;

  // Pobierz kod rabatowy z głównego zamówienia.
  let appliedDiscountCode: string | null = null;
  let appliedDiscountType: "percent" | "fixed" | "free_shipping" | null = null;
  if (primaryOrder.discount_code_id) {
    const { data: dc } = await supabase
      .from("discount_codes")
      .select("code, type")
      .eq("id", primaryOrder.discount_code_id)
      .maybeSingle();
    if (dc) {
      appliedDiscountCode = (dc as { code: string }).code;
      appliedDiscountType = (dc as { type: typeof appliedDiscountType }).type;
    }
  }

  // Suma wszystkich pozycji z koszyka.
  const itemsAmount = allOrderRows.reduce((s, o) => s + (o.amount_grosze ?? 0), 0);
  const fullShipping = Number(shipping.shippingPriceGr ?? 0);
  const rawDiscount = primaryOrder.discount_grosze ?? 0;
  const freeShipping = appliedDiscountType === "free_shipping";
  const effectiveShipping = freeShipping ? 0 : fullShipping;
  const itemsDiscount = freeShipping ? 0 : rawDiscount;
  const totalGr = Math.max(0, itemsAmount - itemsDiscount) + effectiveShipping;

  try {
    await sendOrderConfirmationEmail({
      to,
      orderId: primaryOrder.id,
      customerName: shipping.fullName?.trim() || profile?.full_name?.trim() || "Kliencie",
      items: allOrderRows.map((o) => ({
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
      discountCode: appliedDiscountCode,
      discountGrosze: rawDiscount > 0 ? rawDiscount : undefined,
      freeShipping,
    });
  } catch (err) {
    console.error("[stripe-webhook] sendOrderConfirmationEmail failed:", err);
  }

  // Powiadomienie dla admina
  try {
    await sendAdminNotificationEmail({
      orderId: primaryOrder.id,
      customerName: shipping.fullName ?? profile?.full_name ?? "Klient",
      customerEmail: to ?? "",
      customerPhone: shipping.phone,
      totalGr,
      items: allOrderRows.map((o) => ({
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
  } catch (err) {
    console.error("[stripe-webhook] sendAdminNotificationEmail failed:", err);
  }

  return NextResponse.json({ received: true });
}
