import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        phone: phone || null,
        message,
        type: "support",
      },
    });

    // Send admin notification email (don't fail request if email fails)
    try {
      await sendContactNotification(name, email, phone || null, message);
    } catch (emailError) {
      console.error("Failed to send contact notification email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
