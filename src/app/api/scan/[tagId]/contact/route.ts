import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendScanAlert } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await params;

  try {
    const { phone, message, scanId } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, status: "active" },
      include: {
        pet: {
          include: {
            user: { select: { email: true } },
          },
        },
        item: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!tag || (!tag.pet && !tag.item)) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    // Update the scan record with finder contact info if scanId provided
    if (scanId) {
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          finderPhone: phone,
          finderMessage: message || null,
        },
      });
    }

    // Send another notification to the owner with finder's phone
    const ownerEmail = tag.item?.user.email ?? tag.pet!.user.email;
    const itemName = tag.item?.name ?? tag.pet!.name;

    try {
      await sendScanAlert(
        ownerEmail,
        itemName,
        null,
        null,
        phone,
        new Date()
      );
    } catch {
      console.error("Failed to send finder contact alert");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Finder contact error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
