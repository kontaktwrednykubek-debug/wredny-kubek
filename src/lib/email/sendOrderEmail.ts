import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  OrderConfirmationEmail,
  type OrderEmailItem,
} from "@/emails/OrderConfirmationEmail";

/**
 * Zwraca poprawny adres nadawcy dla Resend.
 * Domena wrednykubek.pl jest zweryfikowana — RESEND_FROM_EMAIL powinno być
 * w formacie "Wredny Kubek <zamowienia@wrednykubek.pl>".
 * Fallback na onboarding@resend.dev tylko gdy brak zmiennej lub domena jest
 * publiczną (gmail, outlook itp.) — Resend nie pozwala ich używać jako nadawcy.
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
 * Opcjonalny override adresata — do testów lokalnych.
 * Jeśli RESEND_SANDBOX_OVERRIDE_TO jest ustawiony, wszystkie maile
 * trafiają na ten adres zamiast do prawdziwego klienta.
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
 * BCC do ADMIN_NOTIFICATION_EMAIL (jeśli ustawiony).
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
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://wrednykubek.pl";
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

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();

  const result = await resend.emails.send({
    from,
    to: resolveResendTo(params.to),
    bcc: adminEmail ? [adminEmail] : undefined,
    subject: `Zamówienie #${params.orderId.slice(0, 8).toUpperCase()} przyjęte — Wredny Kubek`,
    html,
    headers: {
      "X-Entity-Ref-ID": params.orderId,
    },
  });

  if (result.error) {
    console.error("[email] Resend error:", result.error);
    throw new Error(result.error.message);
  }

  return { id: result.data?.id };
}
