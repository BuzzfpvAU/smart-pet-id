"use client";

import Link from "next/link";
import { QrCode, AlertTriangle, LinkIcon, LogIn } from "lucide-react";

export function UnlinkedTagPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
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
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tag Not Set Up Yet
          </h1>
          <p className="text-gray-600 mb-6">
            This tag has been activated but hasn&apos;t been linked to an item yet.
            The owner needs to complete the setup in their dashboard.
          </p>

          {/* How to link instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
            <p className="font-semibold text-amber-800 text-sm mb-3 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              How to link your tag
            </p>
            <ol className="text-sm text-amber-900 space-y-2 list-decimal list-inside">
              <li>Sign in to your account at <Link href="/login" className="text-orange-600 hover:underline font-medium">tagz.au/login</Link></li>
              <li>Go to <strong>My Tags</strong> in the dashboard</li>
              <li>Find this tag and click the <strong>Link</strong> button</li>
              <li>Choose an existing item or create a new one</li>
            </ol>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full bg-black text-white rounded-lg py-3 px-4 font-medium hover:bg-gray-800 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Sign In to Set Up
            </Link>
          </div>
        </div>

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
