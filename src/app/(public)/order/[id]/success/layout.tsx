import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed | Tagz.au",
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
