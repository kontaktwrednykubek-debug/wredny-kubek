import * as React from "react";
import { Section, Text, Hr } from "@react-email/components";
import { EmailShell, EMAIL_COLORS } from "./_shared";

export interface AdminOrderItem {
  name: string;
  quantity: number;
  variant?: string;
}

export interface AdminPaymentEmailProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: string;
  deliveryMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    extraInfo?: string;
  };
  items: AdminOrderItem[];
  logoUrl: string;
}

export function AdminPaymentNotificationEmail({
  orderId,
  customerName,
  customerEmail,
  customerPhone = "Nie podano",
  amount,
  deliveryMethod,
  shippingAddress,
  items,
  logoUrl,
}: AdminPaymentEmailProps) {
  const orderShort = orderId.slice(0, 8).toUpperCase();
  const previewText = `🔥 Zamówienie #${orderShort} opłacone! Szykuj paczkę.`;

  return (
    <EmailShell preview={previewText} logoUrl={logoUrl}>
      <Section
        style={{
          backgroundColor: EMAIL_COLORS.card,
          borderRadius: "12px",
          border: `1px solid ${EMAIL_COLORS.border}`,
          borderTop: "4px solid #4caf50",
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <Text
          style={{
            color: "#4caf50",
            fontSize: "20px",
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
          Klient pomyślnie opłacił zamówienie przez Stripe. Poniżej znajdziesz kompletne dane do spakowania i wysyłki.
        </Text>

        {/* Główne info */}
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
            Łączna kwota:{" "}
            <strong style={{ color: EMAIL_COLORS.primary }}>{amount}</strong>
          </Text>
        </Section>

        {/* Zamówione produkty */}
        <Text
          style={{
            color: EMAIL_COLORS.primary,
            fontSize: "16px",
            fontWeight: "bold",
            margin: "20px 0 10px 0",
          }}
        >
          📦 Zamówione produkty:
        </Text>
        <Section
          style={{
            backgroundColor: EMAIL_COLORS.bg,
            borderRadius: "8px",
            padding: "16px",
            border: `1px solid ${EMAIL_COLORS.border}`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              style={{ marginBottom: index === items.length - 1 ? 0 : "12px" }}
            >
              <Text
                style={{
                  color: EMAIL_COLORS.text,
                  fontSize: "14px",
                  margin: 0,
                  fontWeight: "bold",
                }}
              >
                {item.name} x{item.quantity}
              </Text>
              {item.variant && (
                <Text
                  style={{
                    color: EMAIL_COLORS.muted,
                    fontSize: "12px",
                    margin: "2px 0 0 0",
                  }}
                >
                  Wariant: {item.variant}
                </Text>
              )}
            </div>
          ))}
        </Section>

        {/* Dane klienta i wysyłka */}
        <Text
          style={{
            color: EMAIL_COLORS.primary,
            fontSize: "16px",
            fontWeight: "bold",
            margin: "20px 0 10px 0",
          }}
        >
          🚚 Dane odbiorcy i wysyłka:
        </Text>
        <Section
          style={{
            backgroundColor: EMAIL_COLORS.bg,
            borderRadius: "8px",
            padding: "16px",
            border: `1px solid ${EMAIL_COLORS.border}`,
          }}
        >
          <Text style={{ color: EMAIL_COLORS.text, fontSize: "14px", margin: "0 0 6px 0" }}>
            <strong>Klient:</strong> {customerName}
          </Text>
          <Text style={{ color: EMAIL_COLORS.text, fontSize: "14px", margin: "0 0 6px 0" }}>
            <strong>Email:</strong> {customerEmail}
          </Text>
          <Text style={{ color: EMAIL_COLORS.text, fontSize: "14px", margin: "0 0 12px 0" }}>
            <strong>Telefon:</strong> {customerPhone}
          </Text>

          <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "12px 0" }} />

          <Text style={{ color: EMAIL_COLORS.text, fontSize: "14px", margin: "0 0 6px 0" }}>
            <strong>Sposób dostawy:</strong> {deliveryMethod}
          </Text>
          <Text style={{ color: EMAIL_COLORS.text, fontSize: "14px", margin: "0", lineHeight: "1.5" }}>
            <strong>Adres:</strong>
            <br />
            {shippingAddress.street}
            <br />
            {shippingAddress.postalCode} {shippingAddress.city}
          </Text>
          {shippingAddress.extraInfo && (
            <Text
              style={{
                color: EMAIL_COLORS.primary,
                fontSize: "14px",
                fontWeight: "bold",
                margin: "8px 0 0 0",
              }}
            >
              📍 {shippingAddress.extraInfo}
            </Text>
          )}
        </Section>

        <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "24px 0 16px 0" }} />
        <Text
          style={{
            color: EMAIL_COLORS.muted,
            fontSize: "13px",
            fontStyle: "italic",
            margin: "0",
          }}
        >
          Możesz już przejść do panelu administracyjnego i wygenerować etykietę w Furgonetce.
        </Text>
      </Section>
    </EmailShell>
  );
}

export default AdminPaymentNotificationEmail;
