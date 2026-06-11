import * as React from "react";
import {
  Body,
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
  discountCode?: string | null;
  discountGrosze?: number;
  freeShipping?: boolean;
  /** @deprecated unused — kept for backward compat */
  trackingUrl?: string;
  /** @deprecated unused — kept for backward compat */
  logoUrl?: string;
};

function formatPrice(gr: number) {
  return `${(gr / 100).toFixed(2).replace(".", ",")} zł`;
}

/**
 * NoLink: renderuje tekst jako zwykly tekst, niemożliwy do auto-linkowania
 * przez Gmail/iOS Mail (telefon, adres). Pusty `<a>` bez href + inline style
 * blokuje auto-detect i kliknięcie.
 */
function NoLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      style={{
        color: "inherit",
        textDecoration: "none",
        cursor: "default",
        pointerEvents: "none",
      }}
    >
      {children}
    </a>
  );
}

export function OrderConfirmationEmail({
  orderId,
  customerName,
  items,
  shipping,
  totalGr,
  shippingPriceGr,
  discountCode,
  discountGrosze,
  freeShipping,
}: OrderEmailProps) {
  const firstName = customerName.split(" ")[0];
  const orderShort = orderId.slice(0, 8).toUpperCase();

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
        Twoje wredne zamówienie #{orderShort} zostało przyjęte do realizacji.
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

            <Text style={{ fontSize: "15px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
              Hajs doleciał — Twoje zamówienie{" "}
              <strong style={{ color: C.seledyn }}>#{orderShort}</strong>{" "}
              właśnie wskoczyło na produkcję.
            </Text>

            {/* Podsumowanie */}
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
                  margin: "0 0 12px 0",
                }}
              >
                Podsumowanie
              </Text>

              {items.map((item, idx) => (
                <table
                  key={idx}
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "6px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ fontSize: "14px", padding: "2px 0" }}>
                        {item.quantity}× {item.label}
                      </td>
                      <td
                        style={{
                          fontSize: "14px",
                          padding: "2px 0",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatPrice(item.unitPriceGr * item.quantity)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ))}

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  borderTop: `1px solid ${C.border}`,
                  marginTop: "8px",
                  paddingTop: "8px",
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ fontSize: "13px", color: C.muted, padding: "4px 0" }}>
                      Dostawa
                      {shipping.methodName ? ` (${shipping.methodName})` : ""}
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: C.muted,
                        padding: "4px 0",
                        textAlign: "right",
                      }}
                    >
                      {freeShipping || shippingPriceGr === 0
                        ? "Gratis"
                        : formatPrice(shippingPriceGr)}
                    </td>
                  </tr>
                  {discountCode &&
                    discountGrosze &&
                    discountGrosze > 0 &&
                    !freeShipping && (
                      <tr>
                        <td
                          style={{
                            fontSize: "13px",
                            color: C.seledyn,
                            padding: "4px 0",
                          }}
                        >
                          Rabat ({discountCode})
                        </td>
                        <td
                          style={{
                            fontSize: "13px",
                            color: C.seledyn,
                            padding: "4px 0",
                            textAlign: "right",
                          }}
                        >
                          − {formatPrice(discountGrosze)}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  borderTop: `2px solid ${C.text}`,
                  marginTop: "8px",
                  paddingTop: "10px",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{ fontSize: "16px", fontWeight: 700, padding: "2px 0" }}
                    >
                      Razem
                    </td>
                    <td
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: C.seledyn,
                        padding: "2px 0",
                        textAlign: "right",
                      }}
                    >
                      {formatPrice(totalGr)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Adres dostawy — nieklikalne */}
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
                  margin: "0 0 10px 0",
                }}
              >
                Adres dostawy
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  lineHeight: "1.6",
                  margin: 0,
                  color: C.text,
                }}
              >
                <NoLink>
                  <strong>{shipping.fullName}</strong>
                  <br />
                  {shipping.address}
                  <br />
                  {shipping.zip} {shipping.city}
                  <br />
                  Tel.: {shipping.phone}
                </NoLink>
              </Text>
              {shipping.parcelCode && (
                <Text style={{ fontSize: "13px", margin: "10px 0 0 0" }}>
                  <NoLink>
                    Paczkomat: <strong>{shipping.parcelCode}</strong>
                  </NoLink>
                </Text>
              )}
            </Section>

            <Text style={{ fontSize: "14px", lineHeight: "1.6", margin: "0 0 14px 0" }}>
              Damy znać, jak tylko paczka ruszy w drogę. Dzięki za zaufanie! 🙏
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

export default OrderConfirmationEmail;
