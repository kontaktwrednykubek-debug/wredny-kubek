import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Section,
  Text,
} from "@react-email/components";

/**
 * Wspólne kolory wszystkich maili Wrednego Kubka.
 * Primary = turkus z theme aplikacji (hsl(184 61% 55%)).
 */
export const EMAIL_COLORS = {
  bg: "#0f0f0f",
  card: "#1a1a1a",
  border: "#2a2a2a",
  text: "#f5f5f5",
  muted: "#a0a0a0",
  primary: "#46C9D2", // turkus z logo / przyciski w aplikacji
  primaryDark: "#2A8B94",
  primaryAccent: "#7FE0E8",
} as const;

export function EmailHeader({ logoUrl }: { logoUrl: string }) {
  return (
    <Section
      style={{
        backgroundColor: EMAIL_COLORS.card,
        borderRadius: "12px",
        border: `1px solid ${EMAIL_COLORS.border}`,
        padding: "32px 24px",
        textAlign: "center",
        borderTop: `4px solid ${EMAIL_COLORS.primary}`,
        marginBottom: "24px",
      }}
    >
      <Img
        src={logoUrl}
        alt="Wredny Kubek"
        width="96"
        height="96"
        style={{ margin: "0 auto", display: "block" }}
      />
      <Text
        style={{
          color: EMAIL_COLORS.primary,
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
          color: EMAIL_COLORS.muted,
          fontSize: "13px",
          margin: "4px 0 0 0",
          letterSpacing: "0.5px",
        }}
      >
        ☕🔥 Stwórz swój własny merch
      </Text>
    </Section>
  );
}

export function EmailFooter() {
  return (
    <>
      <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "16px 0" }} />
      <Section style={{ textAlign: "center", padding: "16px 0" }}>
        <Text
          style={{
            color: EMAIL_COLORS.text,
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
            color: EMAIL_COLORS.muted,
            fontSize: "12px",
            lineHeight: "1.5",
            margin: "12px 0 0 0",
          }}
        >
          Wredny Kubek — Milena
          <br />
          ul. Nieznana 13, 00-000 Niewidoczna
          <br />
          tel. +48 00 000 00 00
        </Text>
        <Text
          style={{
            color: EMAIL_COLORS.muted,
            fontSize: "11px",
            marginTop: "16px",
          }}
        >
          © {new Date().getFullYear()} Wredny Kubek. Wszystkie prawa zastrzeżone.
        </Text>
      </Section>
    </>
  );
}

export function EmailShell({
  preview,
  logoUrl,
  children,
}: {
  preview: string;
  logoUrl: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: EMAIL_COLORS.bg,
          color: EMAIL_COLORS.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Preview text (ukryty, pokazuje się w skrzynce) */}
        <div style={{ display: "none", overflow: "hidden", maxHeight: 0 }}>
          {preview}
        </div>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <EmailHeader logoUrl={logoUrl} />
          {children}
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
