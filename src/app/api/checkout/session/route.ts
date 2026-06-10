import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
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
 * `/api/webhook`, który ustawi PAID i wyśle maila potwierdzającego.
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
  // user może być null — dozwolony guest checkout

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { orderId } = parsed.data;

  // Pobierz zamówienie. Dla gości używamy service clienta (RLS zablokuje anon).
  const orderClient = user ? supabase : createSupabaseServiceClient();
  const { data: order, error: orderErr } = await orderClient
    .from("orders")
    .select(
      "id, user_id, product_id, label, quantity, amount_grosze, preview_url, shipping_info, status, discount_code_id, discount_grosze",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  // Walidacja własności: zalogowany user musi być właścicielem,
  // gość może tworzyć sesję tylko dla zamówienia bez user_id.
  if (user && order.user_id && order.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!user && order.user_id) {
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

  // Dociągamy informacje o kodzie rabatowym (jeśli użyty) — potrzebujemy typu
  // i stripe_promotion_code_id.
  type DiscountRow = {
    type: "percent" | "fixed" | "free_shipping";
    stripe_promotion_code_id: string | null;
  };
  let discountCodeRow: DiscountRow | null = null;
  if (order.discount_code_id) {
    // UWAGA: discount_codes ma RLS “tylko admin” — musimy użyć service clienta.
    const service = createSupabaseServiceClient();
    const { data: dc, error: dcErr } = await service
      .from("discount_codes")
      .select("type, stripe_promotion_code_id")
      .eq("id", order.discount_code_id)
      .maybeSingle();
    if (dcErr) {
      console.error("[checkout/session] discount_codes read error:", dcErr);
    }
    if (dc) discountCodeRow = dc as unknown as DiscountRow;
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  // Stripe wymaga URL <= 2048 znakow i tylko http(s) (nie akceptuje data: URI).
  const previewUrl = order.preview_url ?? null;
  const validImage =
    previewUrl &&
    previewUrl.length <= 2048 &&
    /^https?:\/\//i.test(previewUrl)
      ? previewUrl
      : null;

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: order.quantity ?? 1,
      price_data: {
        currency: "pln",
        unit_amount: Math.round(unitPriceGr),
        product_data: {
          name: (order.label as string | null) ?? order.product_id,
          images: validImage ? [validImage] : undefined,
        },
      },
    },
  ];

  // Dostawa jako osobna pozycja (jeśli > 0). Jeśli kod rabatowy to free_shipping —
  // pomijamy pozycję dostawy (darmowa dostawa).
  const freeShipping = discountCodeRow?.type === "free_shipping";
  if (shippingPriceGr > 0 && !freeShipping) {
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

  // Rabat percent/fixed: przekazujemy Stripe PromotionCode — Stripe pokaże i zastosuje.
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (
    discountCodeRow &&
    discountCodeRow.type !== "free_shipping" &&
    discountCodeRow.stripe_promotion_code_id
  ) {
    discounts.push({ promotion_code: discountCodeRow.stripe_promotion_code_id });
  }

  // Origin z requestu — żeby redirect zawsze wracał na tę domenę co klient (np. wrednykubek.pl, nie vercel)
  const origin =
    req.headers.get("origin") ||
    (req.headers.get("host") ? `https://${req.headers.get("host")}` : null) ||
    env.NEXT_PUBLIC_APP_URL;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      // Metody płatności: pomijamy `payment_method_types` celowo — Stripe Checkout
      // automatycznie wyświetli wszystkie metody włączone w Dashboard (karta, BLIK,
      // Przelewy24, Link itd.).
      // UWAGA: Stripe wymaga allow_promotion_codes: false gdy przekazujemy discounts[]
      ...(discounts.length > 0 ? { discounts } : { allow_promotion_codes: true }),
      customer_email: user?.email ?? shipping.email ?? undefined,
      metadata: {
        orderId: order.id,
        userId: user?.id ?? "",
        discountCodeId: order.discount_code_id ?? "",
      },
      success_url: `${origin}/koszyk/sukces?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
      cancel_url: `${origin}/koszyk/checkout?status=cancel&orderId=${order.id}`,
    });
  } catch (err) {
    console.error("[checkout/session] Stripe.checkout.sessions.create failed:", {
      err,
      orderId: order.id,
      hasDiscounts: discounts.length > 0,
      discountType: discountCodeRow?.type,
      promoCodeId: discountCodeRow?.stripe_promotion_code_id,
    });
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Stripe: ${err.message}`
            : "Stripe session creation failed",
      },
      { status: 500 },
    );
  }

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe session has no URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
