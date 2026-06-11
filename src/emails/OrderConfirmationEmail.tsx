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
  /** Suma KOŃCOWA do zapłaty (po rabatach). */
  totalGr: number;
  shippingPriceGr: number;
  /** Kod rabatowy zastosowany do tego zamówienia (opcjonalnie). */
  discountCode?: string | null;
  /** Wartość rabatu w groszach (opcjonalnie). */
  discountGrosze?: number;
  /** Czy rabat to darmowa dostawa — wtedy linijka dostawy pokazuje „Gratis". */
  freeShipping?: boolean;
  /** @deprecated unused — kept for backward compat */
  trackingUrl?: string;
  /** @deprecated unused — kept for backward compat */
  logoUrl?: string;
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
  discountCode,
  discountGrosze,
  freeShipping,
}: OrderEmailProps) {
  const firstName = customerName.split(" ")[0];
  const orderShort = orderId.slice(0, 8).toUpperCase();

  return (
    <Html>
      <Head />
      <Preview>
        Potwierdzenie zamówienia #{orderShort} — {firstName}, zamówienie
        zostało przyjęte do realizacji.
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
              Odnotowaliśmy Twoją wpłatę!
            </Text>
          </Section>

          {/* TREŚĆ */}
          <Section style={{ lineHeight: "1.6", fontSize: "16px" }}>
            <Text style={{ fontWeight: "600", fontSize: "18px" }}>
              Siema {firstName}!
            </Text>

            <Text>
              No i cyk — hajs doleciał bezpiecznie, więc odwrotu już nie ma.
              Twój Wredny Kubek właśnie wskoczył na produkcję, a nasze drukarki
              już szykują się do popełnienia czegoś totalnie bezczelnego. ☕😈
            </Text>

            {/* Numer zamówienia */}
            <Section
              style={{
                backgroundColor: C.seledynLight,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                padding: "14px 16px",
                margin: "16px 0",
              }}
            >
              <Text
                style={{
                  fontSize: "11px",
                  color: C.muted,
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
                  color: C.seledyn,
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                #{orderShort}
              </Text>
            </Section>

            <Text style={{ fontWeight: "bold", fontSize: "17px", marginTop: "24px" }}>
              Co się teraz dzieje w kwaterze głównej?
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
                🎯 <strong>Wybieramy ideał:</strong> Szukamy najładniejszego
                kubka, który godnie zniesie Twój ulubiony napój.
              </Text>
              <Text style={{ margin: "6px 0", fontSize: "15px" }}>
                🎨 <strong>Personalizacja:</strong> Nasi spece od „wredności"
                zaczynają nanosić Twój wzór. Robimy to z chirurgiczną precyzją.
              </Text>
              <Text style={{ margin: "6px 0", fontSize: "15px" }}>
                📦 <strong>Pakowanie:</strong> Owijamy go tak mocno, żeby
                przetrwał nawet spotkanie z najbardziej niezdarnym kurierem
                świata.
              </Text>
            </Section>

            {/* Twoje łupy */}
            <Text style={{ fontWeight: "bold", fontSize: "17px" }}>
              Twoje łupy:
            </Text>

            <Section
              style={{
                backgroundColor: C.seledynLight,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                padding: "16px",
                margin: "12px 0",
              }}
            >
              {items.map((item, idx) => (
                <Text
                  key={idx}
                  style={{
                    fontSize: "15px",
                    margin: "4px 0",
                    borderBottom:
                      idx < items.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                    paddingBottom: idx < items.length - 1 ? "8px" : "0",
                  }}
                >
                  {item.quantity}× {item.label} —{" "}
                  <strong>{formatPrice(item.unitPriceGr * item.quantity)}</strong>
                </Text>
              ))}

              <Text
                style={{
                  fontSize: "13px",
                  color: C.muted,
                  margin: "12px 0 4px 0",
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: "10px",
                }}
              >
                Dostawa{shipping.methodName ? ` (${shipping.methodName})` : ""}:{" "}
                {freeShipping || shippingPriceGr === 0
                  ? "Gratis"
                  : formatPrice(shippingPriceGr)}
              </Text>

              {discountCode && discountGrosze && discountGrosze > 0 && !freeShipping && (
                <Text style={{ fontSize: "13px", color: C.seledyn, margin: "4px 0" }}>
                  Rabat ({discountCode}): − {formatPrice(discountGrosze)}
                </Text>
              )}
              {discountCode && freeShipping && (
                <Text style={{ fontSize: "13px", color: C.seledyn, margin: "4px 0" }}>
                  Kod ({discountCode}): darmowa dostawa
                </Text>
              )}

              <Text
                style={{
                  fontSize: "17px",
                  fontWeight: "bold",
                  color: C.seledyn,
                  margin: "10px 0 0 0",
                  borderTop: `2px solid ${C.seledyn}`,
                  paddingTop: "10px",
                }}
              >
                Razem: {formatPrice(totalGr)}
              </Text>
            </Section>

            {/* Adres dostawy */}
            <Text style={{ fontWeight: "bold", fontSize: "17px", marginTop: "24px" }}>
              Gdzie to wyślemy?
            </Text>

            <Section
              style={{
                backgroundColor: C.seledynLight,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                padding: "16px",
                margin: "12px 0 24px 0",
              }}
            >
              <Text style={{ fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
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
                    marginTop: "10px",
                    fontSize: "13px",
                    color: C.text,
                  }}
                >
                  📍 Paczkomat:{" "}
                  <strong style={{ fontFamily: "monospace", color: C.seledyn }}>
                    {shipping.parcelCode}
                  </strong>
                </Text>
              )}
            </Section>

            <Text>
              Damy Ci znać, jak tylko paczka nabierze mocy prawnej i ruszy w
              drogę. Na razie możesz spokojnie zaplanować, co do niego wlejesz
              jako pierwsze. 😉
            </Text>

            <Text>
              Dzięki za zaufanie! 🙏
            </Text>

            <Text style={{ fontWeight: "bold", marginTop: "24px" }}>
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

export default OrderConfirmationEmail;
