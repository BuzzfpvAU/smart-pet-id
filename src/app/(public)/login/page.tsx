import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In - Tagz.au",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 bg-gradient-to-b from-accent/5 via-background to-background">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
