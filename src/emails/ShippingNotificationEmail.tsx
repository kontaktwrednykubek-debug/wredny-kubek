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
  const trackUrl = `https://www.epaka.pl/sledzenie-przesylek?nr=${encodeURIComponent(trackingNumber)}`;

  return (
    <Html dir="ltr" lang="pl">
      <Head>
        <meta
          name="format-detection"
          content="telephone=no, date=no, address=no, email=no"
        />
        <meta name="x-apple-disable-message-reformatting" />
      </Head>
      <Preview>
        Twoja paczka właśnie ruszyła w drogę! Znajdziesz tu link do śledzenia
        zamówienia.
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
              Paczka przekazana kurierowi!
            </Text>
          </Section>

          {/* TREŚĆ */}
          <Section style={{ lineHeight: "1.6", fontSize: "16px" }}>
            <Text style={{ fontWeight: "600", fontSize: "18px" }}>
              Siema {firstName}!
            </Text>

            <Text style={{ fontSize: "14px" }}>
              Dobra wiadomość – spakowaliśmy Twój wredny kubek tak mocno, że
              kurier musiałby się naprawdę postarać, żeby coś mu zrobić. Paczka
              opuściła już naszą kwaterę główną i zmierza prosto do Ciebie. 📦🚀
            </Text>

            {/* Szczegóły dostawy */}
            <Section
              style={{
                backgroundColor: C.seledynLight,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                padding: "16px",
                margin: "24px 0",
              }}
            >
              {deliveryMethod && (
                <Text
                  style={{
                    fontSize: "15px",
                    margin: "0 0 8px 0",
                    fontWeight: "bold",
                    color: C.text,
                  }}
                >
                  Przewoźnik:{" "}
                  <span style={{ color: C.seledyn }}>{deliveryMethod}</span>
                </Text>
              )}
              <Text
                style={{ fontSize: "14px", margin: "0 0 12px 0", color: C.muted }}
              >
                Numer przesyłki:{" "}
                <code
                  style={{
                    fontFamily: "monospace",
                    fontSize: "15px",
                    color: C.text,
                    fontWeight: "bold",
                  }}
                >
                  {trackingNumber}
                </code>
              </Text>
              <Text style={{ fontSize: "15px", margin: "0" }}>
                👉{" "}
                <Link
                  href={trackUrl}
                  style={{
                    color: C.seledyn,
                    fontWeight: "bold",
                    textDecoration: "underline",
                  }}
                >
                  Kliknij tutaj, aby śledzić swoją paczkę
                </Link>
              </Text>
            </Section>

            <Text style={{ fontSize: "14px" }}>
              Teraz ruch jest po stronie kuriera. Wyglądaj powiadomień lub
              SMS-a, gdy paczka dotrze na miejsce.
            </Text>

            <Text style={{ fontSize: "14px" }}>
              Jak już doleci, rozpakuj ją ostrożnie i niech dobrze służy! 😉
            </Text>

            <Text style={{ fontSize: "14px", fontWeight: "bold", marginTop: "24px" }}>
              Pozdro,
              <br />
              Ekipa Wrednego Kubka ☕🔥
            </Text>
          </Section>

          <Hr style={{ borderColor: C.border, margin: "32px 0 24px 0" }} />

          {/* STOPKA */}
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                fontSize: "12px",
                color: C.muted,
                fontWeight: "500",
                letterSpacing: "0.5px",
                margin: "0",
              }}
            >
              wrednykubek.pl
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ShippingNotificationEmail;
