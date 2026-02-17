"use client";

import { useEffect, useState } from "react";
import { QrCode, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

const PARTNER_URL = "https://buzzfpv.com.au/products/smart-qr-code";
const REDIRECT_DELAY = 3000;

export default function BuyPage() {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = PARTNER_URL;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <QrCode className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Taking you to our partner site</h1>
          <p className="text-muted-foreground">
            to complete the purchase.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting in {countdown}...</span>
        </div>

        <div className="pt-4 space-y-3">
          <a
            href={PARTNER_URL}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
          >
            Click here if you&apos;re not redirected
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Go back to Tagz.au
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
