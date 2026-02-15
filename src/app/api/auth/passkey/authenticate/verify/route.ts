import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { webAuthnConfig } from "@/lib/webauthn";
import { authChallengeStore } from "../options/route";
import { createPasskeyToken } from "@/lib/passkey-tokens";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { response } = body;

    if (!response?.id) {
      return NextResponse.json(
        { error: "Invalid response" },
        { status: 400 }
      );
    }

    // Find the passkey by credential ID
    const credentialIDBase64 = response.id;
    const passkey = await prisma.passkey.findUnique({
      where: { credentialID: credentialIDBase64 },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!passkey) {
      return NextResponse.json(
        { error: "Passkey not found. It may have been removed." },
        { status: 400 }
      );
    }

    // Find and validate the challenge
    const clientDataJSON = JSON.parse(
      Buffer.from(response.response.clientDataJSON, "base64url").toString("utf-8")
    );
    const expectedChallenge = clientDataJSON.challenge;

    const storedChallenge = authChallengeStore.get(expectedChallenge);
    if (!storedChallenge || storedChallenge.expiresAt < Date.now()) {
      authChallengeStore.delete(expectedChallenge);
      return NextResponse.json(
        { error: "Challenge expired. Please try again." },
        { status: 400 }
      );
    }
    authChallengeStore.delete(expectedChallenge);

    // Build the authenticator device object for verification
    const authenticator = {
      credentialID: Buffer.from(passkey.credentialID, "base64url"),
      credentialPublicKey: new Uint8Array(passkey.credentialPublicKey),
      counter: Number(passkey.counter),
      transports: passkey.transports as AuthenticatorTransport[],
    };

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
      authenticator,
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 400 }
      );
    }

    // Update the counter to prevent replay attacks
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        credentialDeviceType: verification.authenticationInfo.credentialDeviceType,
        credentialBackedUp: verification.authenticationInfo.credentialBackedUp,
      },
    });

    const user = passkey.user;

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 400 }
      );
    }

    // Create a one-time token that the Credentials provider can exchange for a session
    const passkeyToken = createPasskeyToken(user.id);

    return NextResponse.json({
      verified: true,
      passkeyToken,
      email: user.email,
    });
  } catch (error) {
    console.error("Verify authentication error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
