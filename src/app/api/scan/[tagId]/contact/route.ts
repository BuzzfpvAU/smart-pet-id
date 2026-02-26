import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendScanAlert } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await params;

  try {
    const { phone, message, scanId, description, scannerName, scannerContact } = await req.json();

    if (!phone && !description) {
      return NextResponse.json(
        { error: "Phone number or description is required" },
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

    // Update the scan record with finder contact info if scanId provided
    // Validate that the scan belongs to this tag to prevent IDOR
    if (scanId) {
      await prisma.scan.updateMany({
        where: { id: scanId, tagId: tag.id },
        data: {
          finderPhone: phone || scannerContact || null,
          finderMessage: description || message || null,
        },
      });
    }

    // Look up scan location and suburb name to include in notification
    let scanLat: number | null = null;
    let scanLng: number | null = null;
    let scanLocationName: string | null = null;
    if (scanId) {
      const scanRecord = await prisma.scan.findFirst({
        where: { id: scanId, tagId: tag.id },
        select: { latitude: true, longitude: true, locationName: true },
      });
      if (scanRecord) {
        scanLat = scanRecord.latitude;
        scanLng = scanRecord.longitude;
        scanLocationName = scanRecord.locationName;
      }
    }

    // Send notification to the owner with finder's details
    const ownerEmail = tag.item?.user.email ?? tag.pet!.user.email;
    const itemName = tag.item?.name ?? tag.pet!.name;

    try {
      await sendScanAlert(
        ownerEmail,
        itemName,
        scanLat,
        scanLng,
        phone || scannerContact || null,
        new Date(),
        description || message || null,
        scanLocationName
      );
    } catch {
      console.error("Failed to send finder contact alert");
    }

    // Send detailed alerts to emergency contacts for emergency-contact type
    if (tag.item?.tagType?.slug === "emergency-contact" && description) {
      const itemData = (tag.item.data || {}) as Record<string, unknown>;
      const emergencyContacts = itemData.emergencyContacts as
        | { name: string; phone: string; email: string }[]
        | undefined;

      if (emergencyContacts && emergencyContacts.length > 0) {
        const { sendEmergencyDetailedAlert } = await import("@/lib/email");

        // Send sequentially with delay to avoid Resend rate limits
        for (let i = 0; i < emergencyContacts.length; i++) {
          const contact = emergencyContacts[i];
          if (i > 0) await new Promise((r) => setTimeout(r, 1500));
          try {
            await sendEmergencyDetailedAlert(
              contact.email,
              contact.name,
              tag.item!.name,
              description,
              scannerName || null,
              scannerContact || phone || null,
              scanLat,
              scanLng,
              new Date(),
              scanLocationName
            );
            console.log(`Detailed alert sent to contact ${i} (${contact.name})`);
          } catch (err) {
            console.error(`Failed to send detailed alert to contact ${i}:`, err);
          }
        }
      }
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
