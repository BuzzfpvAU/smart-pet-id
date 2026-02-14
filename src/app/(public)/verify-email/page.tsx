import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verify Email - Tagz.au",
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
