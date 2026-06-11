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

  // Sprawdź czy już nie zostało zaktualizowane przez webhook
  const { data: existing } = await supabase
    .from("orders")
    .select("status, amount_grosze, shipping_info, user_id, product_id, label, quantity, preview_url, discount_code_id, discount_grosze")
    .eq("id", orderId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Atomowy update — tylko jeśli status === PENDING.
  // Zapobiega wyścigu z webhook: ten kto pierwszy zaktualizuje wysyła mail.
  const { data: justUpdated } = await supabase
    .from("orders")
    .update({ status: "PAID" })
    .eq("id", orderId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();

  if (!justUpdated) {
    // Webhook już oznaczył jako PAID — nie wysyłaj maila ponownie
    return NextResponse.json({ paid: true, alreadyUpdated: true });
  }

  // Zapisz użycie kodu rabatowego jeśli był użyty
  if (existing.discount_code_id) {
    try {
      await supabase.from("discount_code_uses").insert({
        discount_code_id: existing.discount_code_id,
        user_id: existing.user_id,
        order_id: orderId,
        discount_grosze: existing.discount_grosze ?? 0,
      });
      const { data: dc } = await supabase
        .from("discount_codes")
        .select("times_used")
        .eq("id", existing.discount_code_id)
        .maybeSingle();
      if (dc) {
        await supabase
          .from("discount_codes")
          .update({ times_used: (dc.times_used ?? 0) + 1 })
          .eq("id", existing.discount_code_id);
      }
    } catch (err) {
      console.error("[verify] discount code tracking failed:", err);
    }
  }

  // Wyślij email potwierdzający
  try {
    const shipping = (existing.shipping_info ?? {}) as Record<string, string>;
    const profile = existing.user_id
      ? (await supabase.from("profiles").select("email, full_name").eq("id", existing.user_id).maybeSingle()).data
      : null;

    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? null;
    const to = profile?.email ?? shipping.email ?? customerEmail;

    if (to) {
      const { data: dcRow } = existing.discount_code_id
        ? await supabase.from("discount_codes").select("code, type").eq("id", existing.discount_code_id).maybeSingle()
        : { data: null };

      const freeShipping = (dcRow as { type?: string } | null)?.type === "free_shipping";
      const fullShipping = Number(shipping.shippingPriceGr ?? 0);
      const rawDiscount = existing.discount_grosze ?? 0;
      const itemsDiscount = freeShipping ? 0 : rawDiscount;
      const effectiveShipping = freeShipping ? 0 : fullShipping;
      const totalGr = Math.max(0, (existing.amount_grosze ?? 0) - itemsDiscount) + effectiveShipping;

      await sendOrderConfirmationEmail({
        to,
        orderId,
        customerName: shipping.fullName ?? profile?.full_name ?? "Kliencie",
        items: [{
          productId: existing.product_id,
          label: (existing.label as string | null) ?? existing.product_id,
          quantity: existing.quantity ?? 1,
          unitPriceGr: (existing.amount_grosze ?? 0) / (existing.quantity ?? 1),
          previewUrl: existing.preview_url,
        }],
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
    }
  } catch (err) {
    console.error("[verify] sendOrderConfirmationEmail failed:", err);
  }

  // Powiadomienie dla admina
  try {
    const shipping2 = (existing.shipping_info ?? {}) as Record<string, string>;
    const customerEmail2 =
      session.customer_details?.email ?? session.customer_email ?? "";
    const profile2 = existing.user_id
      ? (await supabase.from("profiles").select("email, full_name").eq("id", existing.user_id).maybeSingle()).data
      : null;
    const freeShipping2 = shipping2.shippingPriceGr === "0";
    const fullShipping2 = Number(shipping2.shippingPriceGr ?? 0);
    const rawDiscount2 = existing.discount_grosze ?? 0;
    const totalGr2 = Math.max(0, (existing.amount_grosze ?? 0) - (freeShipping2 ? 0 : rawDiscount2)) + (freeShipping2 ? 0 : fullShipping2);

    await sendAdminNotificationEmail({
      orderId,
      customerName: shipping2.fullName ?? profile2?.full_name ?? "Klient",
      customerEmail: profile2?.email ?? shipping2.email ?? customerEmail2,
      customerPhone: shipping2.phone,
      totalGr: totalGr2,
      items: [{
        name: (existing.label as string | null) ?? existing.product_id ?? "",
        quantity: existing.quantity ?? 1,
      }],
      deliveryMethod: shipping2.shippingMethodName ?? "Nieznana",
      shippingAddress: {
        street: shipping2.address ?? "",
        city: shipping2.city ?? "",
        postalCode: shipping2.zip ?? "",
        extraInfo: shipping2.parcelCode ? `Paczkomat: ${shipping2.parcelCode}` : undefined,
      },
    });
  } catch (err) {
    console.error("[verify] sendAdminNotificationEmail failed:", err);
  }

  return NextResponse.json({ paid: true });
}
