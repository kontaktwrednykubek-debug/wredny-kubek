import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  orderIds: z.array(z.string().uuid()).min(1).max(50).optional(),
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
  const { orderId, orderIds: rawOrderIds } = parsed.data;
  // Wszystkie ID z koszyka (min. [orderId] gdy klient nie przekazał listy)
  const allOrderIds = rawOrderIds && rawOrderIds.length > 0 ? rawOrderIds : [orderId];

  // Pobierz WSZYSTKIE zamówienia z tego batcha. Dla gości: service client (RLS blokuje anon).
  const orderClient = user ? supabase : createSupabaseServiceClient();
  const { data: allOrders, error: orderErr } = await orderClient
    .from("orders")
    .select(
      "id, user_id, product_id, label, quantity, amount_grosze, preview_url, shipping_info, status, discount_code_id, discount_grosze",
    )
    .in("id", allOrderIds);

  if (orderErr || !allOrders || allOrders.length === 0) {
    return NextResponse.json({ error: "Orders not found" }, { status: 404 });
  }

  // Pierwsze zamówienie = nośnik shipping_info i ewentualnego rabatu.
  const primaryOrder = allOrders.find((o) => o.id === orderId) ?? allOrders[0];

  // Walidacja własności: zalogowany user musi być właścicielem.
  for (const o of allOrders) {
    if (user && o.user_id && o.user_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (!user && o.user_id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (o.status !== "PENDING") {
      return NextResponse.json({ error: `Order ${o.id} already ${o.status}` }, { status: 409 });
    }
  }

  const shipping = (primaryOrder.shipping_info ?? {}) as Record<string, any>;
  const shippingPriceGr = Number(shipping.shippingPriceGr ?? 0);

  // Dociągamy informacje o kodzie rabatowym z głównego zamówienia.
  type DiscountRow = {
    type: "percent" | "fixed" | "free_shipping";
    stripe_promotion_code_id: string | null;
  };
  let discountCodeRow: DiscountRow | null = null;
  if (primaryOrder.discount_code_id) {
    const service = createSupabaseServiceClient();
    const { data: dc, error: dcErr } = await service
      .from("discount_codes")
      .select("type, stripe_promotion_code_id")
      .eq("id", primaryOrder.discount_code_id)
      .maybeSingle();
    if (dcErr) {
      console.error("[checkout/session] discount_codes read error:", dcErr);
    }
    if (dc) discountCodeRow = dc as unknown as DiscountRow;
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const freeShipping = discountCodeRow?.type === "free_shipping";

  // Buduj line_items dla WSZYSTKICH zamówień z koszyka.
  // Pozycje gratis (amount_grosze = 0) pomijamy w Stripe — są w bazie do produkcji,
  // ale nie trafiają jako line_item (Stripe nie akceptuje unit_amount: 0 w PLN).
  const paidOrders = allOrders.filter((o) => (o.amount_grosze ?? 0) > 0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _gratisOrders = allOrders.filter((o) => (o.amount_grosze ?? 0) === 0);

  if (paidOrders.length === 0) {
    return NextResponse.json(
      { error: "Brak płatnych pozycji w zamówieniu." },
      { status: 400 },
    );
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = paidOrders.map((o) => {
    const unitPriceGr = (o.amount_grosze ?? 0) / Math.max(1, o.quantity ?? 1);
    const previewUrl = o.preview_url ?? null;
    const validImage =
      previewUrl && previewUrl.length <= 2048 && /^https?:\/\//i.test(previewUrl)
        ? previewUrl
        : null;
    return {
      quantity: o.quantity ?? 1,
      price_data: {
        currency: "pln",
        unit_amount: Math.round(unitPriceGr),
        product_data: {
          name: (o.label as string | null) ?? o.product_id,
          images: validImage ? [validImage] : undefined,
        },
      },
    };
  });

  // gratisOrders są zapisane w bazie (do produkcji) ale nie trafiają do Stripe —
  // klient widzi je w mailu potwierdzającym i w panelu zamówień.

  // Dostawa jako osobna pozycja (raz, na całe zamówienie).
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

  // Rabat percent/fixed: Stripe PromotionCode.
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (
    discountCodeRow &&
    discountCodeRow.type !== "free_shipping" &&
    discountCodeRow.stripe_promotion_code_id
  ) {
    discounts.push({ promotion_code: discountCodeRow.stripe_promotion_code_id });
  }

  // Origin z requestu — żeby redirect zawsze wracał na tę domenę co klient.
  const origin =
    req.headers.get("origin") ||
    (req.headers.get("host") ? `https://${req.headers.get("host")}` : null) ||
    env.NEXT_PUBLIC_APP_URL;

  // Zapisujemy WSZYSTKIE IDs w metadata (max 500 znaków; ~13 UUID-ów).
  const orderIdsStr = allOrders.map((o) => o.id).join(",");

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      ...(discounts.length > 0 ? { discounts } : { allow_promotion_codes: true }),
      customer_email: user?.email ?? shipping.email ?? undefined,
      metadata: {
        orderId: primaryOrder.id,
        orderIds: orderIdsStr,
        userId: user?.id ?? "",
        discountCodeId: primaryOrder.discount_code_id ?? "",
      },
      success_url: `${origin}/koszyk/sukces?session_id={CHECKOUT_SESSION_ID}&orderId=${primaryOrder.id}`,
      cancel_url: `${origin}/koszyk/checkout?status=cancel&orderId=${primaryOrder.id}`,
    });
  } catch (err) {
    console.error("[checkout/session] Stripe.checkout.sessions.create failed:", {
      err,
      orderId: primaryOrder.id,
      allOrderIds,
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
