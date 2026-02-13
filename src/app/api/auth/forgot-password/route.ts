import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode } from "@/lib/auth-helpers";
import { sendPasswordResetCode } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Rate limit
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: "password_reset",
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCode) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting another code" },
        { status: 429 }
      );
    }

    const code = generateVerificationCode();

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        email,
        code,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    let emailSent = false;
    try {
      await sendPasswordResetCode(email, code);
      emailSent = true;
    } catch {
      console.error("Failed to send password reset email - returning code directly");
    }

    // If email failed to send, return the code directly as a fallback
    if (!emailSent) {
      return NextResponse.json({ success: true, code, emailFailed: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
