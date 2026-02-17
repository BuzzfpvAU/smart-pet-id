import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode, Bell, Shield, ShoppingCart } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-32 text-center">
          <div className="container max-w-3xl">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-primary/10 p-4">
                <QrCode className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Tagz.au
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              QR code and NFC-enabled smart tags that link to detailed online
              profiles. When someone scans your tag, you get notified instantly
              with their location.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
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
        <section className="py-16 bg-muted/50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Scan or Tap</h3>
                <p className="text-muted-foreground text-sm">
                  Each tag has a unique QR code and NFC chip. Anyone with a
                  smartphone can scan it instantly — no app needed.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Get Notified</h3>
                <p className="text-muted-foreground text-sm">
                  Receive instant email alerts when someone scans your
                  tag, including their GPS location.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Privacy Control</h3>
                <p className="text-muted-foreground text-sm">
                  Toggle your contact info on or off. Keep your details
                  private when you don&apos;t need them visible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  Millions
                </div>
                <p className="text-muted-foreground">
                  Of items lost or stolen each year
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  Instant
                </div>
                <p className="text-muted-foreground">
                  Notifications when your tag is scanned
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
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
        <section className="py-16 bg-muted/50">
          <div className="container text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">Protect What Matters</h2>
            <p className="text-muted-foreground mb-8">
              Create a free account and set up your profile in minutes.
              Unlimited profiles, no subscription required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
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
