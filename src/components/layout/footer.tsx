import Link from "next/link";
import { QrCode } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="font-bold">Tagz.au</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Keep your pets safe with smart QR and NFC ID tags. Instant
              notifications when your pet is found.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Links</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/faq"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Contact Us
              </Link>
              <Link
                href="/b2b"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                B2B / Wholesale
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Get Started</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/register"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Tagz.au. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
