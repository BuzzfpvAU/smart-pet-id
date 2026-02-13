import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("B2B contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
