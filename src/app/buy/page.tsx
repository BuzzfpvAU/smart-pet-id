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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-accent/5 via-background to-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center animate-in-up" style={{ animationDelay: '0ms' }}>
          <div className="rounded-full bg-accent/10 p-4">
            <QrCode className="h-12 w-12 text-accent" />
          </div>
        </div>

        <div className="space-y-2 animate-in-up" style={{ animationDelay: '100ms' }}>
          <h1 className="font-display text-2xl font-bold tracking-tight">Taking you to our partner site</h1>
          <p className="text-muted-foreground">
            to complete the purchase.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-in-up" style={{ animationDelay: '200ms' }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting in {countdown}...</span>
        </div>

        <div className="pt-4 space-y-3 animate-in-up" style={{ animationDelay: '300ms' }}>
          <a
            href={PARTNER_URL}
            className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium"
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
