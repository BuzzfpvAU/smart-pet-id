import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { webAuthnConfig } from "@/lib/webauthn";
import { challengeStore } from "../options/route";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id!;
    const body = await req.json();
    const { response, deviceName } = body;

    // Get stored challenge
    const stored = challengeStore.get(userId);
    if (!stored || stored.expiresAt < Date.now()) {
      challengeStore.delete(userId);
      return NextResponse.json(
        { error: "Challenge expired. Please try again." },
        { status: 400 }
      );
    }

    const expectedChallenge = stored.challenge;
    challengeStore.delete(userId);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    const {
      credentialID,
      credentialPublicKey,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo;

    // Get transports from the response
    const transports = response.response?.transports || [];

    // Convert credentialID (Uint8Array) to base64url string
    const credentialIDBase64 = Buffer.from(credentialID).toString("base64url");

    // Store the passkey in the database
    const passkey = await prisma.passkey.create({
      data: {
        userId,
        credentialID: credentialIDBase64,
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter: BigInt(counter),
        credentialDeviceType,
        credentialBackedUp,
        transports,
        deviceName: deviceName || "Passkey",
      },
    });

    return NextResponse.json({
      verified: true,
      passkey: {
        id: passkey.id,
        deviceName: passkey.deviceName,
        createdAt: passkey.createdAt,
      },
    });
  } catch (error) {
    console.error("Verify registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
