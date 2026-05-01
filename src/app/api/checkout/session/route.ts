import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().uuid(),
});

/**
 * POST /api/checkout/session
 *
 * Tworzy sesję Stripe Checkout dla istniejącego zamówienia (status PENDING).
 * Zwraca URL do przekierowania. Po opłaceniu Stripe wywoła webhook
 * `/api/webhooks/stripe`, który ustawi PAID i wyśle maila potwierdzającego.
 */
export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe nie jest skonfigurowany." },
      { status: 503 },
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { orderId } = parsed.data;

  // Pobierz zamówienie — tylko właściciel może tworzyć sesję
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, user_id, product_id, quantity, amount_grosze, preview_url, shipping_info, status",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json(
      { error: `Order already ${order.status}` },
      { status: 409 },
    );
  }

  const shipping = (order.shipping_info ?? {}) as Record<string, any>;
  const unitPriceGr =
    (order.amount_grosze ?? 0) / Math.max(1, order.quantity ?? 1);
  const shippingPriceGr = Number(shipping.shippingPriceGr ?? 0);

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: order.quantity ?? 1,
      price_data: {
        currency: "pln",
        unit_amount: Math.round(unitPriceGr),
        product_data: {
          name: order.product_id,
          images: order.preview_url ? [order.preview_url] : undefined,
        },
      },
    },
  ];

  // Dostawa jako osobna pozycja (jeśli > 0)
  if (shippingPriceGr > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "pln",
        unit_amount: shippingPriceGr,
        product_data: {
          name: `Dostawa: ${shipping.shippingMethodName ?? "Wysyłka"}`,
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    customer_email: user.email ?? undefined,
    metadata: {
      orderId: order.id,
      userId: user.id,
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/account/zamowienia?ok=${order.id}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/koszyk/checkout?status=cancel&orderId=${order.id}`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe session has no URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
