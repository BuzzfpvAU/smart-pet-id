"use client";

import Link from "next/link";
import { QrCode, UserPlus, ShieldCheck, Bell } from "lucide-react";

interface InactiveTagPageProps {
  activationCode: string;
  tagStatus: string;
}

export function InactiveTagPage({ activationCode, tagStatus }: InactiveTagPageProps) {
  const isDeactivated = tagStatus === "deactivated";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-gray-900">Tagz.au</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <QrCode className="h-10 w-10 text-orange-600" />
          </div>

          {isDeactivated ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Tag Deactivated
              </h1>
              <p className="text-gray-600 mb-6">
                This Tagz.au tag has been deactivated by its owner.
                If you found a lost pet with this tag, the owner may have
                already been reunited with their pet.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Activate This Tag
              </h1>
              <p className="text-gray-600 mb-6">
                This Tagz.au tag hasn&apos;t been activated yet. If this is your tag,
                sign up or sign in to link it to your pet&apos;s profile.
              </p>
            </>
          )}

          {/* Activation Code Display */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tag Code</p>
            <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">
              {activationCode}
            </p>
          </div>

          {/* CTA Buttons */}
          {!isDeactivated && (
            <div className="space-y-3">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 w-full bg-black text-white rounded-lg py-3 px-4 font-medium hover:bg-gray-800 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                Sign Up & Activate
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full bg-white text-gray-900 border-2 border-gray-200 rounded-lg py-3 px-4 font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Already have an account? Sign In
              </Link>
            </div>
          )}

          {isDeactivated && (
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-black text-white rounded-lg py-3 px-4 font-medium hover:bg-gray-800 transition-colors"
            >
              Learn About Tagz.au
            </Link>
          )}
        </div>

        {/* Features */}
        {!isDeactivated && (
          <div className="mt-8 space-y-4">
            <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Why activate your tag?
            </h2>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Protect Your Pet</p>
                  <p className="text-gray-500 text-sm">
                    Create a detailed profile with medical info, photos, and your contact details.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Instant Scan Alerts</p>
                  <p className="text-gray-500 text-sm">
                    Get notified immediately when someone scans your pet&apos;s tag, including their GPS location.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <QrCode className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">No App Needed</p>
                  <p className="text-gray-500 text-sm">
                    Anyone can scan the QR code with their phone camera &mdash; no app download required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <Link href="/" className="text-orange-600 hover:underline">
              Tagz.au
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
