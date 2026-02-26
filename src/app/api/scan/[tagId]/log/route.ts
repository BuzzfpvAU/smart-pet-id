import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reverseGeocode } from "@/lib/geocode";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await params;

  try {
    const { latitude, longitude, scanId: existingScanId } = await req.json();

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, status: "active" },
      include: {
        pet: { select: { id: true } },
        item: { select: { id: true } },
      },
    });

    if (!tag || (!tag.pet && !tag.item)) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    // If existingScanId is provided, update the existing scan with location
    // instead of creating a new one (used when user shares location after initial scan)
    if (existingScanId && latitude != null && longitude != null) {
      const locationName = await reverseGeocode(latitude, longitude);
      await prisma.scan.updateMany({
        where: { id: existingScanId, tagId: tag.id },
        data: { latitude, longitude, locationName },
      });
      return NextResponse.json({ success: true, scanId: existingScanId });
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded?.split(",")[0]?.trim() || undefined;

    // Reverse geocode if we have coordinates
    let locationName: string | null = null;
    if (latitude != null && longitude != null) {
      locationName = await reverseGeocode(latitude, longitude);
    }

    const scan = await prisma.scan.create({
      data: {
        tagId: tag.id,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        locationName,
        ipAddress,
        userAgent,
      },
    });

    // No email sent here — emails are sent from the contact route
    // after the finder submits their details, so the owner gets
    // one comprehensive notification instead of two.

    return NextResponse.json({ success: true, scanId: scan.id });
  } catch (error) {
    console.error("Scan log error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
