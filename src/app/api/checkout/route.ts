import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { calculatePrice } from "@/lib/pricing";
import { env } from "@/lib/env";

const bodySchema = z.object({
  productId: z.enum(["mug", "tshirt", "notebook", "keychain"]),
  designData: z
    .object({
      textElements: z.number().int().min(0).optional(),
      imageElements: z.number().int().min(0).optional(),
    })
    .optional(),
});

/**
 * POST /api/checkout
 * Wylicza cenę PO STRONIE SERWERA i tworzy sesję Stripe Checkout.
 */
export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe nie jest skonfigurowany." },
      { status: 503 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { productId, designData } = parsed.data;

  const amount = calculatePrice(productId, designData ?? {});
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "pln",
          unit_amount: amount,
          product_data: { name: `Personalizacja: ${productId}` },
        },
      },
    ],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/koszyk?status=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/koszyk?status=cancel`,
  });

  return NextResponse.json({ url: session.url });
}
