import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
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

  return (
    <Html>
      <Head />
      <Preview>
        {firstName}, Twój Wredny Kubek właśnie zwiał z magazynu! 🏃💨
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
          style={{ maxWidth: "580px", margin: "0 auto", padding: "32px 16px" }}
        >
          {/* NAGŁÓWEK */}
          <Section style={{ textAlign: "center", marginBottom: "32px" }}>
            <Text
              style={{
                color: C.seledyn,
                fontSize: "32px",
                fontWeight: "900",
                margin: "0",
                letterSpacing: "1px",
              }}
            >
              WREDNY KUBEK
            </Text>
            <Text
              style={{ color: C.muted, fontSize: "14px", margin: "4px 0 0 0" }}
            >
              Twoja paczka już leci!
            </Text>
          </Section>

          {/* TREŚĆ */}
          <Section style={{ lineHeight: "1.6", fontSize: "16px" }}>
            <Text style={{ fontWeight: "600", fontSize: "18px" }}>
              Siema {firstName}!
            </Text>

            <Text>
              Szybka akcja — Twoje zamówienie <strong>#{orderShort}</strong>{" "}
              oficjalnie nas opuściło. Wredny Kubek tak bardzo chciał Cię
              poznać, że prawie sam się zapakował do kartonu.
            </Text>

            <Text
              style={{
                fontWeight: "bold",
                fontSize: "17px",
                marginTop: "24px",
              }}
            >
              Plan wydarzeń:
            </Text>

            <Section
              style={{
                backgroundColor: C.seledynLight,
                borderRadius: "8px",
                padding: "16px",
                margin: "12px 0 24px 0",
              }}
            >
              <Text style={{ margin: "6px 0", fontSize: "15px" }}>
                ✅ Paczka jest już w drodze (prawdopodobnie kłóci się z
                kurierem o to, kto ma prowadzić).
              </Text>
              <Text style={{ margin: "6px 0", fontSize: "15px" }}>
                👀 Wyglądaj przez okno — misja dostawy trwa.
              </Text>
              <Text style={{ margin: "6px 0", fontSize: "15px" }}>
                ☕ Ty szykuj kawę/herbatę, a my trzymamy kciuki, żebyście się
                polubili.
              </Text>
            </Section>

            <Text style={{ fontWeight: "bold", margin: "0 0 8px 0" }}>
              Twój numer przesyłki:
            </Text>

            {deliveryMethod && (
              <Text style={{ margin: "0 0 8px 0", fontSize: "15px" }}>
                Kurier: <strong>{deliveryMethod}</strong>
              </Text>
            )}

            <Section
              style={{
                backgroundColor: C.seledynLight,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                padding: "20px 16px",
                margin: "8px 0 24px 0",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  fontSize: "11px",
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: "0 0 8px 0",
                }}
              >
                List przewozowy
              </Text>
              <Text
                style={{
                  fontSize: "22px",
                  fontFamily: "monospace",
                  color: C.seledyn,
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
                  fontSize: "13px",
                  color: C.muted,
                  margin: "10px 0 0 0",
                }}
              >
                Skopiuj numer i wklej go na stronie kuriera, aby sprawdzić
                status paczki.
              </Text>
            </Section>

            <Text>
              Dzięki za zakupy we Wrednym Kubku. Mamy nadzieję, że będzie Ci
              służył... godnie. 😉
            </Text>

            <Text style={{ fontWeight: "bold", marginTop: "24px" }}>
              Pozdro,
              <br />
              Ekipa Wrednego Kubka ☕🔥
            </Text>
          </Section>

          <Hr
            style={{ borderColor: C.border, margin: "32px 0 24px 0" }}
          />

          {/* STOPKA */}
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                color: C.muted,
                fontSize: "12px",
                lineHeight: "1.6",
                margin: "0",
              }}
            >
              <strong>Wredny Kubek — Milena Bujniak</strong>
              <br />
              Świdnik 25, 58-410 Marciszów
              <br />
              Infolinia: +48 789 111 041
            </Text>
            <Text
              style={{ color: C.muted, fontSize: "12px", margin: "8px 0 4px 0" }}
            >
              <Link
                href="https://wrednykubek.pl"
                style={{ color: C.seledyn, textDecoration: "none" }}
              >
                wrednykubek.pl
              </Link>
            </Text>
            <Text
              style={{ color: C.muted, fontSize: "11px", marginTop: "4px" }}
            >
              © {new Date().getFullYear()} Wredny Kubek. Wszystkie prawa
              zastrzeżone.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ShippingNotificationEmail;
