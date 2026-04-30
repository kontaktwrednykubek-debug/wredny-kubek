import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailShell, EMAIL_COLORS } from "./_shared";

export type ShippingEmailProps = {
  customerName: string;
  orderId: string;
  trackingNumber: string;
  logoUrl: string;
};

export function ShippingNotificationEmail({
  customerName,
  orderId,
  trackingNumber,
  logoUrl,
}: ShippingEmailProps) {
  const firstName = customerName.split(" ")[0];
  const orderShort = orderId.slice(0, 8).toUpperCase();

  return (
    <EmailShell
      preview={`${firstName}, Twój Wredny Kubek właśnie zwiał z magazynu! 🏃💨`}
      logoUrl={logoUrl}
    >
      <Section
        style={{
          backgroundColor: EMAIL_COLORS.card,
          borderRadius: "12px",
          border: `1px solid ${EMAIL_COLORS.border}`,
          padding: "32px 24px",
          marginBottom: "24px",
        }}
      >
        <Text
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: EMAIL_COLORS.text,
            margin: "0 0 16px 0",
          }}
        >
          Siema {firstName}!
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.text,
            lineHeight: "1.6",
            margin: "0 0 20px 0",
          }}
        >
          <strong style={{ color: EMAIL_COLORS.primary }}>Szybka akcja:</strong>{" "}
          Twoje zamówienie{" "}
          <span
            style={{
              fontFamily: "monospace",
              color: EMAIL_COLORS.primary,
              fontWeight: "bold",
            }}
          >
            #{orderShort}
          </span>{" "}
          oficjalnie nas opuściło. Wredny Kubek tak bardzo chciał Cię poznać,
          że prawie sam się zapakował do kartonu.
        </Text>

        <Text
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: EMAIL_COLORS.text,
            margin: "24px 0 12px 0",
          }}
        >
          Plan wydarzeń:
        </Text>

        <div
          style={{
            backgroundColor: EMAIL_COLORS.bg,
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <Text
            style={{
              fontSize: "15px",
              color: EMAIL_COLORS.text,
              lineHeight: "1.8",
              margin: "8px 0",
            }}
          >
            ✅ Paczka jest już w drodze (prawdopodobnie kłóci się z kurierem o
            to, kto ma prowadzić).
          </Text>
          <Text
            style={{
              fontSize: "15px",
              color: EMAIL_COLORS.text,
              lineHeight: "1.8",
              margin: "8px 0",
            }}
          >
            👀 Wyglądaj przez okno – misja dostawy trwa.
          </Text>
          <Text
            style={{
              fontSize: "15px",
              color: EMAIL_COLORS.text,
              lineHeight: "1.8",
              margin: "8px 0",
            }}
          >
            ☕ Ty szykuj kawę/herbatę, a my trzymamy kciuki, żebyście się
            polubili.
          </Text>
        </div>

        {/* Numer przesyłki */}
        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.text,
            margin: "24px 0 12px 0",
            fontWeight: "bold",
          }}
        >
          Twój numer przesyłki:
        </Text>

        <div
          style={{
            backgroundColor: EMAIL_COLORS.bg,
            borderRadius: "8px",
            padding: "16px 20px",
            border: `2px solid ${EMAIL_COLORS.primary}`,
            margin: "0 0 20px 0",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              fontSize: "11px",
              color: EMAIL_COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: "0 0 6px 0",
            }}
          >
              List przewozowy
          </Text>
          <Text
            style={{
              fontSize: "22px",
              fontFamily: "monospace",
              color: EMAIL_COLORS.primary,
              fontWeight: "bold",
              letterSpacing: "1px",
              margin: 0,
              wordBreak: "break-all",
            }}
          >
            {trackingNumber}
          </Text>
          <Text
            style={{
              fontSize: "12px",
              color: EMAIL_COLORS.muted,
              margin: "8px 0 0 0",
            }}
          >
            Skopiuj numer i wklej go na stronie kuriera, jeśli przycisk poniżej
            nie wypełni go automatycznie.
          </Text>
        </div>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.text,
            margin: "16px 0",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Sprawdź, gdzie jest Twój buntownik:
        </Text>

        <div style={{ textAlign: "center", margin: "16px 0 24px" }}>
          <Button
            href={`https://www.epaka.pl/sledzenie-przesylek?nr=${encodeURIComponent(trackingNumber)}`}
            style={{
              backgroundColor: EMAIL_COLORS.primary,
              color: "#0f0f0f",
              padding: "16px 32px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "16px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            ŚLEDŹ PACZKĘ 📦
          </Button>
        </div>

        <Text
          style={{
            fontSize: "15px",
            color: EMAIL_COLORS.muted,
            lineHeight: "1.6",
            margin: "16px 0 0 0",
          }}
        >
          Dzięki za zakupy we Wrednym Kubku. Mamy nadzieję, że będzie Ci
          służył... godnie. 😉
        </Text>
      </Section>
    </EmailShell>
  );
}

export default ShippingNotificationEmail;
