import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { webAuthnConfig } from "@/lib/webauthn";

// Store authentication challenges keyed by the challenge itself
// (since we don't know the user yet during passwordless login)
const authChallengeStore = new Map<string, { expiresAt: number }>();

export { authChallengeStore };

export async function POST() {
  try {
    // For discoverable credentials (passkeys), we don't specify allowCredentials
    // The browser/authenticator will show available passkeys for this RP
    const options = await generateAuthenticationOptions({
      rpID: webAuthnConfig.rpID,
      userVerification: "preferred",
      // Empty allowCredentials = discoverable credential / resident key flow
    });

    // Store challenge for verification
    authChallengeStore.set(options.challenge, {
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // Clean up expired challenges
    for (const [key, value] of authChallengeStore.entries()) {
      if (value.expiresAt < Date.now()) {
        authChallengeStore.delete(key);
      }
    }

    return NextResponse.json(options);
  } catch (error) {
    console.error("Generate authentication options error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
