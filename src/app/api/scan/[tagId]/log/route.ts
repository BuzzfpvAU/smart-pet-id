import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendScanAlert } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await params;

  try {
    const { latitude, longitude } = await req.json();

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
            tagType: { select: { slug: true } },
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

    const userAgent = req.headers.get("user-agent") || undefined;
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded?.split(",")[0]?.trim() || undefined;

    const scan = await prisma.scan.create({
      data: {
        tagId: tag.id,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        ipAddress,
        userAgent,
      },
    });

    // Send email notification to owner
    const ownerEmail = tag.item?.user.email ?? tag.pet!.user.email;
    const itemName = tag.item?.name ?? tag.pet!.name;

    try {
      await sendScanAlert(
        ownerEmail,
        itemName,
        latitude ?? null,
        longitude ?? null,
        null,
        scan.createdAt
      );
    } catch {
      console.error("Failed to send scan alert email");
    }

    // Auto-notify emergency contacts for emergency-contact type
    if (tag.item?.tagType?.slug === "emergency-contact") {
      const itemData = (tag.item.data || {}) as Record<string, unknown>;
      const emergencyContacts = itemData.emergencyContacts as
        | { name: string; phone: string; email: string }[]
        | undefined;

      if (emergencyContacts && emergencyContacts.length > 0) {
        const { sendEmergencyAutoAlert } = await import("@/lib/email");
        await Promise.allSettled(
          emergencyContacts.map((contact) =>
            sendEmergencyAutoAlert(
              contact.email,
              contact.name,
              tag.item!.name,
              latitude ?? null,
              longitude ?? null,
              scan.createdAt
            )
          )
        );
      }
    }

    return NextResponse.json({ success: true, scanId: scan.id });
  } catch (error) {
    console.error("Scan log error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
