import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { brand } from "@/config/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const description =
  "WrednyKubek — personalizowane kubki, koszulki i gadżety. Zaprojektuj swój wymarzony kubek online w kilka minut.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://wredny-kubek.vercel.app",
  ),
  title: { default: brand.name, template: `%s — ${brand.name}` },
  description,
  applicationName: brand.name,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "default",
    startupImage: ["/wk.kubek.png"],
  },
  icons: {
    icon: [
      { url: "/wk.svg", type: "image/svg+xml" },
      { url: "/wk.kubek.png", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/wk.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: brand.name,
    title: brand.name,
    description,
    images: [
      {
        url: "/wk.kubek.png",
        width: 1200,
        height: 630,
        alt: brand.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description,
    images: ["/wk.kubek.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1414" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
