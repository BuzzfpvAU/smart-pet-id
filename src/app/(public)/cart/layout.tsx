import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart | Tagz.au",
  alternates: { canonical: "/cart" },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
