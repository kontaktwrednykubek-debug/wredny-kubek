import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailShell, EMAIL_COLORS } from "./_shared";

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
  const firstName = customerName.split(" ")[0];
  const orderShort = orderId.slice(0, 8).toUpperCase();

  return (
    <EmailShell
      preview={`${firstName}, mamy to! Zamówienie #${orderShort} klepnięte. ☕🔥`}
      logoUrl={logoUrl}
    >
      <Section
        style={{
          backgroundColor: EMAIL_COLORS.card,
          borderRadius: "12px",
          border: `1px solid ${EMAIL_COLORS.border}`,
          padding: "32px 24px",
          marginBottom: "16px",
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
          Wdech, wydech... Stało się. Twoje pieniądze bezpiecznie do nas dotarły,
          a my oficjalnie przyjęliśmy wyzwanie przygotowania Twojego{" "}
          <strong style={{ color: EMAIL_COLORS.primary }}>Wrednego Kubka</strong>.
        </Text>

        {/* Numer zamówienia */}
        <div
          style={{
            backgroundColor: EMAIL_COLORS.bg,
            borderRadius: "8px",
            padding: "12px 16px",
            margin: "16px 0",
            border: `1px solid ${EMAIL_COLORS.primary}`,
          }}
        >
          <Text
            style={{
              fontSize: "11px",
              color: EMAIL_COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: "0 0 4px 0",
            }}
          >
            Numer zamówienia
          </Text>
          <Text
            style={{
              fontSize: "18px",
              fontFamily: "monospace",
              color: EMAIL_COLORS.primary,
              fontWeight: "bold",
              margin: 0,
            }}
          >
            #{orderShort}
          </Text>
        </div>

        <Text
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: EMAIL_COLORS.text,
            margin: "24px 0 12px 0",
          }}
        >
          Co się teraz dzieje w kwaterze głównej?
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
              lineHeight: "1.7",
              margin: "8px 0",
            }}
          >
            🎯 <strong>Wybieramy ideał:</strong> Szukamy najładniejszego kubka,
            który godnie zniesie Twój ulubiony napój.
          </Text>
          <Text
            style={{
              fontSize: "15px",
              color: EMAIL_COLORS.text,
              lineHeight: "1.7",
              margin: "8px 0",
            }}
          >
            🎨 <strong>Personalizacja:</strong> Nasi spece od „wredności"
            zaczynają nanosić Twój wzór. Robimy to z chirurgiczną precyzją.
          </Text>
          <Text
            style={{
              fontSize: "15px",
              color: EMAIL_COLORS.text,
              lineHeight: "1.7",
              margin: "8px 0",
            }}
          >
            📦 <strong>Pakowanie:</strong> Owijamy go tak mocno, żeby przetrwał
            nawet spotkanie z najbardziej niezdarnym kurierem świata.
          </Text>
        </div>

        {/* Twoje łupy */}
        <Text
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: EMAIL_COLORS.text,
            margin: "24px 0 12px 0",
          }}
        >
          Twoje łupy:
        </Text>

        <div
          style={{
            backgroundColor: EMAIL_COLORS.bg,
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                paddingBottom: idx < items.length - 1 ? "12px" : "0",
                marginBottom: idx < items.length - 1 ? "12px" : "0",
                borderBottom:
                  idx < items.length - 1
                    ? `1px solid ${EMAIL_COLORS.border}`
                    : "none",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "64px", verticalAlign: "top" }}>
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewUrl}
                          alt={item.label}
                          width="56"
                          height="56"
                          style={{
                            borderRadius: "8px",
                            border: `1px solid ${EMAIL_COLORS.border}`,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "8px",
                            backgroundColor: EMAIL_COLORS.card,
                            border: `1px solid ${EMAIL_COLORS.border}`,
                          }}
                        />
                      )}
                    </td>
                    <td style={{ verticalAlign: "top", paddingLeft: "12px" }}>
                      <Text
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: EMAIL_COLORS.text,
                          margin: "0 0 4px 0",
                        }}
                      >
                        {item.quantity}× {item.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: "13px",
                          color: EMAIL_COLORS.primary,
                          fontWeight: "bold",
                          margin: 0,
                        }}
                      >
                        {formatPrice(item.unitPriceGr * item.quantity)}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          {/* Dostawa */}
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: `1px solid ${EMAIL_COLORS.border}`,
            }}
          >
            <Text
              style={{
                fontSize: "13px",
                color: EMAIL_COLORS.muted,
                margin: 0,
              }}
            >
              Dostawa{" "}
              {shipping.methodName ? `(${shipping.methodName})` : ""}:{" "}
              {shippingPriceGr === 0 ? "Gratis" : formatPrice(shippingPriceGr)}
            </Text>
          </div>

          {/* Suma */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: `2px solid ${EMAIL_COLORS.primary}`,
            }}
          >
            <tbody>
              <tr>
                <td>
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: EMAIL_COLORS.text,
                      margin: "8px 0 0 0",
                    }}
                  >
                    Razem:
                  </Text>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Text
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: EMAIL_COLORS.primary,
                      margin: "8px 0 0 0",
                    }}
                  >
                    {formatPrice(totalGr)}
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Adres dostawy */}
        <Text
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: EMAIL_COLORS.text,
            margin: "24px 0 12px 0",
          }}
        >
          Gdzie to wyślemy?
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
              color: EMAIL_COLORS.text,
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
                backgroundColor: EMAIL_COLORS.card,
                borderRadius: "6px",
                border: `1px solid ${EMAIL_COLORS.primary}`,
                fontSize: "13px",
                color: EMAIL_COLORS.text,
              }}
            >
              <strong>📍 Paczkomat:</strong>{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  color: EMAIL_COLORS.primary,
                  fontWeight: "bold",
                }}
              >
                {shipping.parcelCode}
              </span>
            </Text>
          )}
        </div>

        <Text
          style={{
            fontSize: "15px",
            color: EMAIL_COLORS.text,
            lineHeight: "1.6",
            margin: "20px 0",
          }}
        >
          Damy Ci znać, jak tylko paczka nabierze mocy prawnej i ruszy w drogę.
          Na razie możesz spokojnie zaplanować, co do niego wlejesz jako
          pierwsze. 😉
        </Text>

        {/* CTA */}
        <div style={{ textAlign: "center", margin: "24px 0 8px" }}>
          <Button
            href={trackingUrl}
            style={{
              backgroundColor: EMAIL_COLORS.primary,
              color: "#0f0f0f",
              padding: "14px 28px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "15px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Sprawdź status zamówienia →
          </Button>
        </div>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.muted,
            textAlign: "center",
            margin: "16px 0 0 0",
          }}
        >
          Dzięki za zaufanie! 🙏
        </Text>
      </Section>
    </EmailShell>
  );
}

export default OrderConfirmationEmail;
