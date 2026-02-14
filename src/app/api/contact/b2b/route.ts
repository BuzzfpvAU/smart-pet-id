import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendB2BNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, message, website, address, currentProducts, neededProducts, salesMethods, targetArea, orderVolume, priority } = body;

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
        type: "b2b",
        website: website || null,
        address: address || null,
        currentProducts: currentProducts || null,
        neededProducts: neededProducts || null,
        salesMethods: salesMethods || null,
        targetArea: targetArea || null,
        orderVolume: orderVolume || null,
        priority: priority || null,
      },
    });

    // Send admin notification email (don't fail request if email fails)
    try {
      await sendB2BNotification({
        name, email, phone, message, website, address,
        currentProducts, neededProducts, salesMethods,
        targetArea, orderVolume, priority,
      });
    } catch (emailError) {
      console.error("Failed to send B2B notification email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("B2B contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
