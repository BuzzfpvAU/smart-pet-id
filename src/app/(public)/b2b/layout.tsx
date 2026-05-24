import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale & B2B Smart Tags Australia",
  description:
    "Partner with Tagz.au for wholesale and B2B smart QR/NFC tags in Australia. Bulk pricing and branded tags for pets, keys, luggage and electronics.",
  alternates: {
    canonical: "/b2b",
  },
};

export default function B2BLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
