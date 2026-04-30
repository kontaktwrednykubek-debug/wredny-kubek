import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  OrderConfirmationEmail,
  type OrderEmailItem,
} from "@/emails/OrderConfirmationEmail";

/**
 * Wysyła email potwierdzający zamówienie.
 * W trybie sandbox używa onboarding@resend.dev jako nadawcy
 * (dojdzie tylko na adres email konta Resend).
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  customerName: string;
  items: OrderEmailItem[];
  shipping: {
    fullName: string;
    address: string;
    city: string;
    zip: string;
    phone: string;
    methodName?: string;
    parcelCode?: string;
  };
  totalGr: number;
  shippingPriceGr: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing — pomijam wysyłkę.");
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const trackingUrl = `${appUrl}/account/zamowienia?ok=${params.orderId}`;
  const logoUrl = `${appUrl}/wk.svg`;

  const from =
    process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes("xxx")
      ? process.env.RESEND_FROM_EMAIL
      : "Wredny Kubek <onboarding@resend.dev>";

  const html = await render(
    OrderConfirmationEmail({
      orderId: params.orderId,
      customerName: params.customerName,
      items: params.items,
      shipping: params.shipping,
      totalGr: params.totalGr,
      shippingPriceGr: params.shippingPriceGr,
      trackingUrl,
      logoUrl,
    }),
  );

  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: `Dziękujemy za zamówienie #${params.orderId.slice(0, 8).toUpperCase()} — Wredny Kubek`,
    html,
  });

  if (result.error) {
    console.error("[email] Resend error:", result.error);
    throw new Error(result.error.message);
  }

  return { id: result.data?.id };
}
