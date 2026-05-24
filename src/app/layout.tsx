import type { Metadata } from "next";
import { Outfit, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tagz.au";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Smart QR & NFC Tags for Pets, Keys & Luggage | Tagz.au",
    template: "%s | Tagz.au",
  },
  description:
    "Smart QR code and NFC tags for pets, keys, luggage and electronics. Attach a tag, create a free profile, and get instant alerts when someone scans it. Australian-made, no subscription fees.",
  applicationName: "Tagz.au",
  keywords: [
    "smart pet tag australia",
    "qr code pet tag",
    "nfc pet id tag",
    "qr luggage tag",
    "nfc key tag",
    "smart tag no subscription",
    "digital pet id australia",
    "lost pet tag qr code",
    "nfc tag australia",
    "pet tag with gps alert",
  ],
  openGraph: {
    type: "website",
    siteName: "Tagz.au",
    locale: "en_AU",
    url: SITE_URL,
    title: "Smart QR & NFC Tags for Pets, Keys & Luggage | Tagz.au",
    description:
      "Smart QR code and NFC tags for pets, keys, luggage and electronics. Create a free profile and get instant alerts when someone scans your tag.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Tagz.au — Smart QR & NFC Tags for Pets, Keys & Luggage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart QR & NFC Tags for Pets, Keys & Luggage | Tagz.au",
    description:
      "Smart QR code and NFC tags for pets, keys, luggage and electronics. Free profile, instant scan alerts, no subscription.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tagz.au",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Smart QR code and NFC tags for pets, keys, luggage and electronics, with instant scan alerts and no subscription fees.",
  areaServed: "AU",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tagz.au",
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${interTight.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
