import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export type OrderEmailItem = {
  productId: string;
  label: string;
  quantity: number;
  unitPriceGr: number;
  previewUrl?: string | null;
};

export type OrderEmailProps = {
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
  trackingUrl: string;
  logoUrl: string;
};

const COLORS = {
  bg: "#0f0f0f",
  card: "#1a1a1a",
  border: "#2a2a2a",
  text: "#f5f5f5",
  muted: "#a0a0a0",
  primary: "#dc2626", // red-600
  primaryDark: "#991b1b",
};

function formatPrice(gr: number) {
  return `${(gr / 100).toFixed(2).replace(".", ",")} zł`;
}

export function OrderConfirmationEmail({
  orderId,
  customerName,
  items,
  shipping,
  totalGr,
  shippingPriceGr,
  trackingUrl,
  logoUrl,
}: OrderEmailProps) {
  const itemsTotal = items.reduce(
    (s, it) => s + it.unitPriceGr * it.quantity,
    0,
  );

  return (
    <Html>
      <Head />
      <Preview>Dziękujemy za zamówienie #{orderId.slice(0, 8)} — Wredny Kubek</Preview>
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
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "14px",
                margin: "4px 0 0 0",
              }}
            >
              Personalizowane kubki, które robią różnicę
            </Text>
          </Section>

          {/* Tytuł */}
          <Section style={{ padding: "32px 0 16px" }}>
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: COLORS.text,
                margin: "0 0 8px 0",
              }}
            >
              Dziękujemy za zamówienie! 🎉
            </Text>
            <Text
              style={{
                fontSize: "16px",
                color: COLORS.muted,
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              Cześć <strong style={{ color: COLORS.text }}>{customerName}</strong>,
              otrzymaliśmy Twoje zamówienie i właśnie zaczynamy nad nim pracować.
            </Text>
          </Section>

          {/* Numer zamówienia */}
          <Section
            style={{
              backgroundColor: COLORS.card,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              padding: "20px 24px",
              marginBottom: "16px",
            }}
          >
            <Text
              style={{
                fontSize: "12px",
                color: COLORS.muted,
                textTransform: "uppercase",
                letterSpacing: "1px",
                margin: "0 0 4px 0",
              }}
            >
              Numer zamówienia
            </Text>
            <Text
              style={{
                fontSize: "20px",
                fontFamily: "monospace",
                color: COLORS.primary,
                fontWeight: "bold",
                margin: 0,
              }}
            >
              #{orderId.slice(0, 8).toUpperCase()}
            </Text>
          </Section>

          {/* Lista produktów */}
          <Section
            style={{
              backgroundColor: COLORS.card,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              padding: "24px",
              marginBottom: "16px",
            }}
          >
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: COLORS.text,
                margin: "0 0 16px 0",
                borderBottom: `1px solid ${COLORS.border}`,
                paddingBottom: "12px",
              }}
            >
              📦 Twoje produkty
            </Text>

            {items.map((item, idx) => (
              <Row
                key={idx}
                style={{
                  marginBottom: idx < items.length - 1 ? "16px" : "0",
                  paddingBottom: idx < items.length - 1 ? "16px" : "0",
                  borderBottom:
                    idx < items.length - 1
                      ? `1px solid ${COLORS.border}`
                      : "none",
                }}
              >
                <Column style={{ width: "72px", verticalAlign: "top" }}>
                  {item.previewUrl ? (
                    <Img
                      src={item.previewUrl}
                      alt={item.label}
                      width="64"
                      height="64"
                      style={{
                        borderRadius: "8px",
                        border: `1px solid ${COLORS.border}`,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "8px",
                        backgroundColor: COLORS.bg,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    />
                  )}
                </Column>
                <Column style={{ verticalAlign: "top", paddingLeft: "12px" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: COLORS.text,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: "12px",
                      color: COLORS.muted,
                      margin: "0 0 4px 0",
                    }}
                  >
                    Ilość: {item.quantity} × {formatPrice(item.unitPriceGr)}
                  </Text>
                  <Text
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: COLORS.primary,
                      margin: 0,
                    }}
                  >
                    {formatPrice(item.unitPriceGr * item.quantity)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Podsumowanie kosztów */}
          <Section
            style={{
              backgroundColor: COLORS.card,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              padding: "20px 24px",
              marginBottom: "16px",
            }}
          >
            <Row>
              <Column>
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: "14px",
                    margin: "0 0 8px 0",
                  }}
                >
                  Produkty
                </Text>
              </Column>
              <Column align="right">
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: "14px",
                    margin: "0 0 8px 0",
                  }}
                >
                  {formatPrice(itemsTotal)}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: "14px",
                    margin: "0 0 12px 0",
                  }}
                >
                  Dostawa {shipping.methodName ? `(${shipping.methodName})` : ""}
                </Text>
              </Column>
              <Column align="right">
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: "14px",
                    margin: "0 0 12px 0",
                  }}
                >
                  {shippingPriceGr === 0 ? "Gratis" : formatPrice(shippingPriceGr)}
                </Text>
              </Column>
            </Row>
            <Hr style={{ borderColor: COLORS.border, margin: "8px 0" }} />
            <Row>
              <Column>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "8px 0 0 0",
                  }}
                >
                  Razem
                </Text>
              </Column>
              <Column align="right">
                <Text
                  style={{
                    color: COLORS.primary,
                    fontSize: "22px",
                    fontWeight: "bold",
                    margin: "8px 0 0 0",
                  }}
                >
                  {formatPrice(totalGr)}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Adres dostawy */}
          <Section
            style={{
              backgroundColor: COLORS.card,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              padding: "20px 24px",
              marginBottom: "16px",
            }}
          >
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: COLORS.text,
                margin: "0 0 12px 0",
              }}
            >
              🚚 Adres dostawy
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontSize: "14px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              <strong>{shipping.fullName}</strong>
              <br />
              {shipping.address}
              <br />
              {shipping.zip} {shipping.city}
              <br />
              📞 {shipping.phone}
            </Text>
            {shipping.parcelCode && (
              <Text
                style={{
                  marginTop: "12px",
                  padding: "10px 12px",
                  backgroundColor: COLORS.bg,
                  borderRadius: "6px",
                  border: `1px solid ${COLORS.primary}`,
                  fontSize: "13px",
                  color: COLORS.text,
                }}
              >
                <strong>Paczkomat:</strong>{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    color: COLORS.primary,
                    fontWeight: "bold",
                  }}
                >
                  {shipping.parcelCode}
                </span>
              </Text>
            )}
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: "center", padding: "24px 0" }}>
            <Button
              href={trackingUrl}
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
              Sprawdź status zamówienia →
            </Button>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "12px",
                marginTop: "12px",
              }}
            >
              Lub skopiuj link:{" "}
              <a
                href={trackingUrl}
                style={{ color: COLORS.primary, wordBreak: "break-all" }}
              >
                {trackingUrl}
              </a>
            </Text>
          </Section>

          <Hr style={{ borderColor: COLORS.border, margin: "16px 0" }} />

          {/* Footer z danymi sklepu */}
          <Section style={{ padding: "16px 0", textAlign: "center" }}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: "13px",
                fontWeight: "bold",
                margin: "0 0 4px 0",
              }}
            >
              Wredny Kubek — Milena
            </Text>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "12px",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              ul. Nieznana 13, 00-000 Niewidoczna
              <br />
              tel. +48 00 000 00 00
            </Text>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "11px",
                marginTop: "16px",
              }}
            >
              © {new Date().getFullYear()} Wredny Kubek. Wszystkie prawa zastrzeżone.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;
