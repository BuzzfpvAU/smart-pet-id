import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.svg" alt="Tagz.au" width={28} height={28} className="h-7 w-7" />
              <span className="font-display font-bold">Tagz.au</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Smart QR and NFC tags for pets, keys, luggage, electronics and
              more. Instant notifications when your items are found.
            </p>
          </div>
          <div>
            <h3 className="font-display font-semibold uppercase tracking-wider text-xs mb-4">Links</h3>
            <nav className="flex flex-col gap-2.5">
              <Link
                href="/buy"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Buy a Tag
              </Link>
              <Link
                href="/faq"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/b2b"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                B2B / Wholesale
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="font-display font-semibold uppercase tracking-wider text-xs mb-4">Get Started</h3>
            <nav className="flex flex-col gap-2.5">
              <Link
                href="/register"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Tagz.au. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
