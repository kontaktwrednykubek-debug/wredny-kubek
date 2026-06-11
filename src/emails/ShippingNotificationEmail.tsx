import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const C = {
  bg: "#ffffff",
  text: "#2d3748",
  muted: "#718096",
  border: "#e2e8f0",
  seledyn: "#14b8a6",
  seledynLight: "#f0fdfa",
};

export type ShippingEmailProps = {
  customerName: string;
  orderId: string;
  trackingNumber: string;
  deliveryMethod?: string;
  /** @deprecated unused — kept for backward compat */
  logoUrl?: string;
  /** @deprecated unused — kept for backward compat */
  orderUrl?: string;
};

export function ShippingNotificationEmail({
  customerName,
  orderId,
  trackingNumber,
  deliveryMethod,
}: ShippingEmailProps) {
  const firstName = customerName.split(" ")[0];
  const orderShort = orderId.slice(0, 8).toUpperCase();
  const trackUrl = `https://www.epaka.pl/sledzenie-przesylek?nr=${encodeURIComponent(
    trackingNumber,
  )}`;

  return (
    <Html>
      <Head>
        <meta
          name="format-detection"
          content="telephone=no, date=no, address=no, email=no"
        />
        <meta name="x-apple-disable-message-reformatting" />
      </Head>
      <Preview>
        Twoje wredne zamówienie #{orderShort} wyruszyło w drogę. 📦
      </Preview>
      <Body
        style={{
          backgroundColor: C.bg,
          color: C.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}
        >
          <Section>
            <Text
              style={{
                fontSize: "20px",
                fontWeight: 700,
                margin: "0 0 8px 0",
              }}
            >
              Siema {firstName}!
            </Text>

            <Text
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                margin: "0 0 20px 0",
              }}
            >
              Twoje zamówienie{" "}
              <strong style={{ color: C.seledyn }}>#{orderShort}</strong>{" "}
              właśnie opuściło nasz warsztat i jest już w drodze.
            </Text>

            {/* Numer przesyłki */}
            <Section
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                padding: "16px 18px",
                margin: "0 0 20px 0",
              }}
            >
              <Text
                style={{
                  fontSize: "11px",
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: "0 0 6px 0",
                }}
              >
                Numer przesyłki
              </Text>
              <Text
                style={{
                  fontSize: "18px",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: C.seledyn,
                  margin: "0 0 4px 0",
                  wordBreak: "break-all",
                }}
              >
                {trackingNumber}
              </Text>
              {deliveryMethod && (
                <Text
                  style={{
                    fontSize: "13px",
                    color: C.muted,
                    margin: 0,
                  }}
                >
                  Kurier: {deliveryMethod}
                </Text>
              )}
            </Section>

            {/* Przycisk sprawdzenia przesyłki */}
            <Section style={{ textAlign: "center", margin: "0 0 24px 0" }}>
              <Button
                href={trackUrl}
                style={{
                  backgroundColor: C.seledyn,
                  color: "#ffffff",
                  padding: "14px 28px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "15px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Sprawdź przesyłkę
              </Button>
            </Section>

            <Text
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 14px 0",
              }}
            >
              Dzięki za zakupy we Wrednym Kubku. Mamy nadzieję, że będzie Ci
              służył... godnie. 😉
            </Text>

            <Text
              style={{
                fontSize: "14px",
                fontWeight: 700,
                margin: "0",
              }}
            >
              Pozdro,
              <br />
              Ekipa Wrednego Kubka ☕🔥
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ShippingNotificationEmail;
