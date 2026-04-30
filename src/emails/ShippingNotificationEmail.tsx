import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type ShippingEmailProps = {
  customerName: string;
  orderId: string;
  logoUrl: string;
};

const COLORS = {
  bg: "#0f0f0f",
  card: "#1a1a1a",
  border: "#2a2a2a",
  text: "#f5f5f5",
  muted: "#a0a0a0",
  primary: "#dc2626", // red-600
};

export function ShippingNotificationEmail({
  customerName,
  orderId,
  logoUrl,
}: ShippingEmailProps) {
  const firstName = customerName.split(" ")[0];

  return (
    <Html>
      <Head />
      <Preview>
        {firstName}, Twój Wredny Kubek właśnie zwiał z magazynu! 🏃💨
      </Preview>
      <Body
        style={{
          backgroundColor: COLORS.bg,
          color: COLORS.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          {/* Header z logo */}
          <Section
            style={{
              backgroundColor: COLORS.card,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              padding: "32px 24px",
              textAlign: "center",
              borderTop: `4px solid ${COLORS.primary}`,
              marginBottom: "24px",
            }}
          >
            <Img
              src={logoUrl}
              alt="Wredny Kubek"
              width="80"
              height="80"
              style={{ margin: "0 auto", display: "block" }}
            />
            <Text
              style={{
                color: COLORS.primary,
                fontSize: "28px",
                fontWeight: "bold",
                margin: "16px 0 0 0",
                letterSpacing: "0.5px",
              }}
            >
              WREDNY KUBEK
            </Text>
          </Section>

          {/* Główna treść */}
          <Section
            style={{
              backgroundColor: COLORS.card,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              padding: "32px 24px",
              marginBottom: "24px",
            }}
          >
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: COLORS.text,
                margin: "0 0 16px 0",
              }}
            >
              Siema {firstName}!
            </Text>

            <Text
              style={{
                fontSize: "16px",
                color: COLORS.text,
                lineHeight: "1.6",
                margin: "0 0 20px 0",
              }}
            >
              <strong style={{ color: COLORS.primary }}>Szybka akcja:</strong>{" "}
              Twoje zamówienie{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  color: COLORS.primary,
                  fontWeight: "bold",
                }}
              >
                #{orderId.slice(0, 8).toUpperCase()}
              </span>{" "}
              oficjalnie nas opuściło. Wredny Kubek tak bardzo chciał Cię poznać,
              że prawie sam się zapakował do kartonu.
            </Text>

            <Text
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: COLORS.text,
                margin: "24px 0 12px 0",
              }}
            >
              Plan wydarzeń:
            </Text>

            <div
              style={{
                backgroundColor: COLORS.bg,
                borderRadius: "8px",
                padding: "16px 20px",
                marginBottom: "20px",
              }}
            >
              <Text
                style={{
                  fontSize: "15px",
                  color: COLORS.text,
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
                  color: COLORS.text,
                  lineHeight: "1.8",
                  margin: "8px 0",
                }}
              >
                👀 Wyglądaj przez okno – misja dostawy trwa.
              </Text>
              <Text
                style={{
                  fontSize: "15px",
                  color: COLORS.text,
                  lineHeight: "1.8",
                  margin: "8px 0",
                }}
              >
                ☕ Ty szykuj kawę/herbatę, a my trzymamy kciuki, żebyście się
                polubili.
              </Text>
            </div>

            <Text
              style={{
                fontSize: "16px",
                color: COLORS.text,
                margin: "24px 0 16px 0",
                fontWeight: "bold",
              }}
            >
              Sprawdź, gdzie jest Twój buntownik:
            </Text>

            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <Button
                href="https://www.epaka.pl/sledzenie-przesylek"
                style={{
                  backgroundColor: COLORS.primary,
                  color: "#ffffff",
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

            <Hr style={{ borderColor: COLORS.border, margin: "24px 0" }} />

            <Text
              style={{
                fontSize: "15px",
                color: COLORS.muted,
                lineHeight: "1.6",
                margin: "16px 0 0 0",
              }}
            >
              Dzięki za zakupy we Wrednym Kubku. Mamy nadzieję, że będzie Ci
              służył... godnie. 😉
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center", padding: "16px 0" }}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: "14px",
                fontWeight: "bold",
                margin: "0 0 4px 0",
              }}
            >
              Pozdro,
              <br />
              Ekipa Wrednego Kubka ☕🔥
            </Text>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "12px",
                marginTop: "16px",
              }}
            >
              Wredny Kubek — Milena
              <br />
              ul. Nieznana 13, 00-000 Niewidoczna
              <br />
              tel. +48 00 000 00 00
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ShippingNotificationEmail;
