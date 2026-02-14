import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateItemSchema, buildItemDataSchema } from "@/lib/item-validation";
import type { FieldGroupDefinition } from "@/lib/tag-types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        tagType: true,
        tags: {
          select: {
            id: true,
            activationCode: true,
            shortCode: true,
            status: true,
            _count: { select: { scans: true } },
          },
        },
      },
    });

    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Get item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { tagType: true },
    });

    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateItemSchema.parse(body);

    // Validate data against tag type field definitions if data is provided
    if (parsed.data) {
      const fieldGroups = item.tagType.fieldGroups as unknown as FieldGroupDefinition[];
      const dataSchema = buildItemDataSchema(fieldGroups);
      dataSchema.parse(parsed.data);
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.data !== undefined) updateData.data = parsed.data;
    if (parsed.photoUrls !== undefined) updateData.photoUrls = parsed.photoUrls;
    if (parsed.primaryPhotoUrl !== undefined) updateData.primaryPhotoUrl = parsed.primaryPhotoUrl;
    if (parsed.ownerPhone !== undefined) updateData.ownerPhone = parsed.ownerPhone;
    if (parsed.ownerEmail !== undefined) updateData.ownerEmail = parsed.ownerEmail;
    if (parsed.ownerAddress !== undefined) updateData.ownerAddress = parsed.ownerAddress;
    if (parsed.rewardOffered !== undefined) updateData.rewardOffered = parsed.rewardOffered;
    if (parsed.rewardDetails !== undefined) updateData.rewardDetails = parsed.rewardDetails;
    if (parsed.visibility !== undefined) updateData.visibility = parsed.visibility;

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: updateData as any,
      include: {
        tagType: { select: { slug: true, name: true, icon: true, color: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update item error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.item.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
