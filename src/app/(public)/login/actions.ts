"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(
  _prevState: { error: string; redirect?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Check if the underlying cause is unverified email
      const causeMessage =
        error.cause?.err?.message || (error as unknown as { message?: string }).message || "";
      if (causeMessage.includes("EMAIL_NOT_VERIFIED")) {
        redirect(`/verify-email?email=${encodeURIComponent(email)}`);
      }

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    // Next.js redirect throws an error, so we need to re-throw it
    throw error;
  }
}
