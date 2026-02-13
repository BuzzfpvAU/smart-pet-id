import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode } from "@/lib/auth-helpers";
import { sendVerificationCode, sendPasswordResetCode } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, type } = await req.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email and type are required" },
        { status: 400 }
      );
    }

    if (type !== "email_verify" && type !== "password_reset") {
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
    }

    // Rate limit: check if a code was sent in the last 60 seconds
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        type,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCode) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting another code" },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Return success even if user not found to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const code = generateVerificationCode();

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        email,
        code,
        type,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      if (type === "email_verify") {
        await sendVerificationCode(email, code);
      } else {
        await sendPasswordResetCode(email, code);
      }
    } catch {
      console.error("Failed to send email");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
