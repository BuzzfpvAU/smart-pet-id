import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { QrCode, Bell, Shield, ShoppingCart, Tag } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 md:py-36 text-center bg-gradient-to-b from-accent/5 via-background to-background before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top_center,oklch(0.84_0.18_90/0.08),transparent_60%)]">
          <div className="container max-w-3xl relative">
            <div className="flex justify-center mb-8 animate-in-up" style={{ animationDelay: '0ms' }}>
              <Image src="/logo.png" alt="Tagz.au" width={280} height={420} className="h-auto w-70 md:w-80 drop-shadow-[0_0_40px_oklch(0.84_0.18_90/0.3)]" priority />
            </div>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in-up" style={{ animationDelay: '200ms' }}>
              Smart QR code and NFC tags for pets, keys, luggage, electronics
              and more. Attach a tag, create a profile, and get notified
              instantly when someone scans it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in-up" style={{ animationDelay: '300ms' }}>
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/buy">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy a Tag
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/faq">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-gradient-to-br from-muted/40 via-muted/20 to-background">
          <div className="container">
            <h2 className="font-display text-3xl font-bold tracking-tight text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6 animate-in-up" style={{ animationDelay: '100ms' }}>
                <div className="rounded-full bg-accent/10 p-3 w-fit mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Scan or Tap</h3>
                <p className="text-muted-foreground text-sm">
                  Each tag has a unique QR code and NFC chip. Anyone can scan
                  it with a smartphone — no app needed.
                </p>
              </div>
              <div className="text-center p-6 animate-in-up" style={{ animationDelay: '200ms' }}>
                <div className="rounded-full bg-accent/10 p-3 w-fit mx-auto mb-4">
                  <Bell className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Get Notified</h3>
                <p className="text-muted-foreground text-sm">
                  Receive instant email alerts when someone scans your tag,
                  including their GPS location.
                </p>
              </div>
              <div className="text-center p-6 animate-in-up" style={{ animationDelay: '300ms' }}>
                <div className="rounded-full bg-accent/10 p-3 w-fit mx-auto mb-4">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Privacy Control</h3>
                <p className="text-muted-foreground text-sm">
                  Toggle your contact info on or off. Choose exactly what
                  details are visible when someone scans your tag.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="animate-in-up" style={{ animationDelay: '100ms' }}>
                <div className="font-display text-5xl font-bold text-accent mb-2">
                  12+
                </div>
                <p className="text-muted-foreground">
                  Tag types for pets, keys, luggage and more
                </p>
              </div>
              <div className="animate-in-up" style={{ animationDelay: '200ms' }}>
                <div className="font-display text-5xl font-bold text-accent mb-2">
                  Instant
                </div>
                <p className="text-muted-foreground">
                  Scan alerts with GPS location
                </p>
              </div>
              <div className="animate-in-up" style={{ animationDelay: '300ms' }}>
                <div className="font-display text-5xl font-bold text-accent mb-2">
                  Free
                </div>
                <p className="text-muted-foreground">
                  No subscription fees, ever
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-muted/40 via-muted/20 to-background">
          <div className="container text-center max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">Get Started Today</h2>
            <p className="text-muted-foreground mb-8">
              Create a free account and set up your first tag in minutes.
              Unlimited tags, no subscription required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/buy">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy a Tag
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
