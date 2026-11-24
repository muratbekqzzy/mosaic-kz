import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Jost } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { site } from "@/config/site";
import en from "@/i18n/en.json";
import { Providers } from "@/components/ui/Providers";
import { Header } from "@/components/ui/Header";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import { Cursor } from "@/components/ui/Cursor";
import { FluidBackground } from "@/components/ui/FluidBackground";

// Display: Instrument Serif — soft, high-contrast, quietly luxurious. UI/body: Jost — refined geometric sans.
const display = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Jost({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: en.meta.title, template: "%s — MOSAIC.KZ" },
  description: en.meta.description,
  keywords: [
    "мозаика Алматы",
    "мозаика из мрамора",
    "мраморная мозаика",
    "гибкий мрамор Алматы",
    "мозаика для ванной",
    "травертин мозаика",
    "оникс мозаика",
    "мозаика Казахстан",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ru_KZ", "kk_KZ"],
    siteName: site.name,
    title: en.meta.title,
    description: en.meta.description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: en.meta.title, description: en.meta.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F4EEE3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <FluidBackground />
        <Providers>
          <Header />
          {children}
          <WhatsAppFab />
          <Cursor />
        </Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
