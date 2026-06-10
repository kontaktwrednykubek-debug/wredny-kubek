import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailShell, EMAIL_COLORS } from "./_shared";

export interface AdminPaymentEmailProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: string;
  productLabel: string;
  shippingMethod: string;
  logoUrl: string;
}

export function AdminPaymentNotificationEmail({
  orderId,
  customerName,
  customerEmail,
  amount,
  productLabel,
  shippingMethod,
  logoUrl,
}: AdminPaymentEmailProps) {
  const orderShort = orderId.slice(0, 8).toUpperCase();
  const previewText = `Nowa wpłata! Zamówienie #${orderShort} opłacone.`;

  return (
    <EmailShell preview={previewText} logoUrl={logoUrl}>
      <Section
        style={{
          backgroundColor: EMAIL_COLORS.card,
          borderRadius: "12px",
          border: `1px solid ${EMAIL_COLORS.border}`,
          padding: "24px",
          marginBottom: "16px",
          borderTop: "4px solid #4caf50",
        }}
      >
        <Text
          style={{
            color: "#4caf50",
            fontSize: "22px",
            fontWeight: "bold",
            margin: "0 0 16px 0",
          }}
        >
          🔥 Nowa kasa na koncie!
        </Text>
        <Text
          style={{
            color: EMAIL_COLORS.text,
            fontSize: "15px",
            lineHeight: "1.6",
            margin: "0 0 16px 0",
          }}
        >
          Klient właśnie opłacił zamówienie przez Stripe. Czas szykować kubek!
        </Text>

        <Section
          style={{
            backgroundColor: EMAIL_COLORS.bg,
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
            border: `1px solid ${EMAIL_COLORS.border}`,
          }}
        >
          <Text style={{ color: EMAIL_COLORS.muted, fontSize: "14px", margin: "0" }}>
            Zamówienie:{" "}
            <strong style={{ color: EMAIL_COLORS.text }}>#{orderShort}</strong>
          </Text>
          <Text style={{ color: EMAIL_COLORS.muted, fontSize: "14px", margin: "6px 0 0 0" }}>
            Produkt:{" "}
            <strong style={{ color: EMAIL_COLORS.text }}>{productLabel}</strong>
          </Text>
          <Text style={{ color: EMAIL_COLORS.muted, fontSize: "14px", margin: "6px 0 0 0" }}>
            Kwota:{" "}
            <strong style={{ color: EMAIL_COLORS.primary }}>{amount}</strong>
          </Text>
          <Text style={{ color: EMAIL_COLORS.muted, fontSize: "14px", margin: "6px 0 0 0" }}>
            Klient:{" "}
            <strong style={{ color: EMAIL_COLORS.text }}>{customerName}</strong>{" "}
            ({customerEmail})
          </Text>
          <Text style={{ color: EMAIL_COLORS.muted, fontSize: "14px", margin: "6px 0 0 0" }}>
            Dostawa:{" "}
            <strong style={{ color: EMAIL_COLORS.text }}>{shippingMethod}</strong>
          </Text>
        </Section>

        <Text
          style={{
            color: EMAIL_COLORS.muted,
            fontSize: "13px",
            fontStyle: "italic",
            margin: "0",
          }}
        >
          Status zamówienia zaktualizowany automatycznie na <strong style={{ color: "#4caf50" }}>Opłacone</strong>.
          Sprawdź panel admina, żeby wygenerować etykietę i nadać przesyłkę.
        </Text>
      </Section>
    </EmailShell>
  );
}

export default AdminPaymentNotificationEmail;
