"use client";

import Link from "next/link";
import { QrCode, UserPlus, ShieldCheck, Bell, ShoppingCart } from "lucide-react";

interface InactiveTagPageProps {
  activationCode: string;
  tagStatus: string;
}

export function InactiveTagPage({ activationCode, tagStatus }: InactiveTagPageProps) {
  const isDeactivated = tagStatus === "deactivated";

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/5 to-background">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-accent" />
            <span className="font-display font-semibold">Tagz.au</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Main Card */}
        <div className="bg-card rounded-2xl shadow-lg border p-6 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <QrCode className="h-10 w-10 text-accent" />
          </div>

          {isDeactivated ? (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">
                Tag Deactivated
              </h1>
              <p className="text-muted-foreground mb-6">
                This Tagz.au tag has been deactivated by its owner.
                If you found an item with this tag, the owner may have
                already recovered it.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">
                Activate This Tag
              </h1>
              <p className="text-muted-foreground mb-6">
                This Tagz.au tag hasn&apos;t been activated yet. If this is your tag,
                sign up or sign in to activate and link it to your profile.
              </p>
            </>
          )}

          {/* Activation Code Display */}
          <div className="bg-muted rounded-lg p-3 mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tag Code</p>
            <p className="text-lg font-mono font-bold tracking-wider">
              {activationCode}
            </p>
          </div>

          {/* CTA Buttons */}
          {!isDeactivated && (
            <div className="space-y-3">
              <Link
                href={`/register?activationCode=${encodeURIComponent(activationCode)}`}
                className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground rounded-2xl py-3 px-4 font-semibold hover:bg-accent/90 active:scale-[0.97] transition-all duration-200"
              >
                <UserPlus className="h-5 w-5" />
                Sign Up & Activate
              </Link>
              <Link
                href={`/login?activationCode=${encodeURIComponent(activationCode)}`}
                className="flex items-center justify-center gap-2 w-full bg-card border-2 border-border rounded-2xl py-3 px-4 font-medium hover:border-accent/50 transition-all duration-200"
              >
                Already have an account? Sign In
              </Link>
              <div className="pt-2">
                <Link
                  href="/buy"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline font-medium"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Want your own tag? Buy one here
                </Link>
              </div>
            </div>
          )}

          {isDeactivated && (
            <div className="space-y-3">
              <Link
                href="/buy"
                className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground rounded-2xl py-3 px-4 font-semibold hover:bg-accent/90 active:scale-[0.97] transition-all duration-200"
              >
                <ShoppingCart className="h-5 w-5" />
                Buy Your Own Tag
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full bg-card border-2 border-border rounded-2xl py-3 px-4 font-medium hover:border-accent/50 transition-all duration-200"
              >
                Learn About Tagz.au
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        {!isDeactivated && (
          <div className="mt-8 space-y-4">
            <h2 className="text-center text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide">
              Why activate your tag?
            </h2>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 bg-card rounded-2xl p-4 shadow-sm border hover:-translate-y-0.5 hover:shadow-[0_4px_20px_hsl(var(--shadow-color)/0.15)] transition-all duration-300">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-display font-medium text-sm">Protect What Matters</p>
                  <p className="text-muted-foreground text-sm">
                    Create a detailed profile with photos, descriptions, and your contact details.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card rounded-2xl p-4 shadow-sm border hover:-translate-y-0.5 hover:shadow-[0_4px_20px_hsl(var(--shadow-color)/0.15)] transition-all duration-300">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-display font-medium text-sm">Instant Scan Alerts</p>
                  <p className="text-muted-foreground text-sm">
                    Get notified immediately when someone scans your tag, including their GPS location.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card rounded-2xl p-4 shadow-sm border hover:-translate-y-0.5 hover:shadow-[0_4px_20px_hsl(var(--shadow-color)/0.15)] transition-all duration-300">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <QrCode className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-display font-medium text-sm">No App Needed</p>
                  <p className="text-muted-foreground text-sm">
                    Anyone can scan the QR code with their phone camera &mdash; no app download required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <Link href="/" className="text-accent hover:underline font-display font-semibold">
              Tagz.au
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
