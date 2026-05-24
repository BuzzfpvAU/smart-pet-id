import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Smart Tags | Tagz.au",
  description:
    "Buy QR + NFC smart tags for pets, keys, luggage and more. Singles and bundle packs available with free activation.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
