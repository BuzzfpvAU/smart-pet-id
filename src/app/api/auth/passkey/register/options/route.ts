import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { webAuthnConfig } from "@/lib/webauthn";

// Store challenges in memory (per-user) with expiration
// In production you'd use Redis or similar, but this works for single-instance
const challengeStore = new Map<string, { challenge: string; expiresAt: number }>();

export { challengeStore };

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id!;

    // Get existing passkeys to exclude
    const existingPasskeys = await prisma.passkey.findMany({
      where: { userId },
      select: { credentialID: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName: webAuthnConfig.rpName,
      rpID: webAuthnConfig.rpID,
      userID: userId,
      userName: session.user.email!,
      userDisplayName: session.user.name || session.user.email!,
      attestationType: "none",
      excludeCredentials: existingPasskeys.map((pk) => ({
        id: Buffer.from(pk.credentialID, "base64url"),
        type: "public-key" as const,
        transports: pk.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Store challenge for verification
    challengeStore.set(userId, {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // Clean up expired challenges
    for (const [key, value] of challengeStore.entries()) {
      if (value.expiresAt < Date.now()) {
        challengeStore.delete(key);
      }
    }

    return NextResponse.json(options);
  } catch (error) {
    console.error("Generate registration options error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
