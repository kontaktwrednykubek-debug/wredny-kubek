import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  OrderConfirmationEmail,
  type OrderEmailItem,
} from "@/emails/OrderConfirmationEmail";

/**
 * Zwraca poprawny adres nadawcy dla Resend.
 * Jeśli RESEND_FROM_EMAIL używa niezweryfikowanej darmowej domeny
 * (gmail, outlook, yahoo itp.), automatycznie przełącza się na
 * sandboxowy `onboarding@resend.dev` — inaczej Resend zwraca 403.
 */
export function resolveResendFrom(): string {
  const raw = process.env.RESEND_FROM_EMAIL?.trim();
  const fallback = "Wredny Kubek <onboarding@resend.dev>";

  if (!raw || raw.includes("xxx")) return fallback;

  // Wyciągnij czysty email z formatu "Name <email@x>"
  const match = raw.match(/<([^>]+)>/);
  const email = (match?.[1] ?? raw).toLowerCase();
  const domain = email.split("@")[1] ?? "";

  const blockedDomains = [
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "icloud.com",
    "wp.pl",
    "o2.pl",
    "interia.pl",
  ];

  if (blockedDomains.includes(domain)) {
    console.warn(
      `[email] Domena ${domain} nie może być nadawcą w Resend. Używam ${fallback}`,
    );
    return fallback;
  }

  return raw;
}

/**
 * W trybie sandbox Resend (bez zweryfikowanej domeny) pozwala wysyłać
 * tylko na adres właściciela konta. Ustawiając RESEND_SANDBOX_OVERRIDE_TO
 * możesz wymusić wszystkie maile na ten adres (do testów).
 */
export function resolveResendTo(intendedTo: string): string {
  const override = process.env.RESEND_SANDBOX_OVERRIDE_TO?.trim();
  if (override) {
    console.warn(
      `[email] SANDBOX OVERRIDE: zamiast ${intendedTo} wysyłam na ${override}`,
    );
    return override;
  }
  return intendedTo;
}

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
  discountCode?: string | null;
  discountGrosze?: number;
  freeShipping?: boolean;
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

  const from = resolveResendFrom();

  console.log("[email] Wysyłka:", {
    from,
    to: params.to,
    orderId: params.orderId,
  });

  const html = await render(
    OrderConfirmationEmail({
      orderId: params.orderId,
      customerName: params.customerName,
      items: params.items,
      shipping: params.shipping,
      totalGr: params.totalGr,
      shippingPriceGr: params.shippingPriceGr,
      discountCode: params.discountCode,
      discountGrosze: params.discountGrosze,
      freeShipping: params.freeShipping,
      trackingUrl,
      logoUrl,
    }),
  );

  const result = await resend.emails.send({
    from,
    to: resolveResendTo(params.to),
    subject: `Dziękujemy za zamówienie #${params.orderId.slice(0, 8).toUpperCase()} — Wredny Kubek`,
    html,
  });

  if (result.error) {
    console.error("[email] Resend error:", result.error);
    throw new Error(result.error.message);
  }

  return { id: result.data?.id };
}
