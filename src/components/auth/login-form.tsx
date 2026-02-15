"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginAction } from "@/app/(public)/login/actions";
import { Fingerprint } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const router = useRouter();
  const verified = searchParams.get("verified") === "true";
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const supportsPasskeys = typeof window !== "undefined" && browserSupportsWebAuthn();

  async function handlePasskeyLogin() {
    setPasskeyLoading(true);
    setPasskeyError(null);

    try {
      // Step 1: Get authentication options
      const optionsRes = await fetch("/api/auth/passkey/authenticate/options", {
        method: "POST",
      });

      if (!optionsRes.ok) {
        throw new Error("Failed to get authentication options");
      }

      const options = await optionsRes.json();

      // Step 2: Start WebAuthn authentication in the browser
      const authentication = await startAuthentication(options);

      // Step 3: Verify with the server
      const verifyRes = await fetch("/api/auth/passkey/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authentication }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Authentication failed");
      }

      const { passkeyToken, email } = await verifyRes.json();

      // Step 4: Exchange the passkey token for a NextAuth session
      const result = await signIn("credentials", {
        email,
        passkeyToken,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Failed to create session");
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err.name === "NotAllowedError") {
        setPasskeyError("Authentication was cancelled");
      } else {
        setPasskeyError(err.message || "Passkey authentication failed");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {verified && (
            <div className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 text-sm p-3 rounded-md">
              Email verified successfully! You can now sign in.
            </div>
          )}
          {state?.error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {state.error}
            </div>
          )}
          {passkeyError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {passkeyError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
          <SubmitButton />
        </form>

        {supportsPasskeys && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
            >
              <Fingerprint className="h-4 w-4" />
              {passkeyLoading ? "Authenticating..." : "Sign in with Passkey"}
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
