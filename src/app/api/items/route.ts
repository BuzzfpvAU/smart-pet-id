import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createItemSchema, buildItemDataSchema } from "@/lib/item-validation";
import type { FieldGroupDefinition } from "@/lib/tag-types";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.item.findMany({
      where: { userId: session.user.id },
      include: {
        tagType: { select: { slug: true, name: true, icon: true, color: true } },
        tags: {
          select: { id: true, activationCode: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("List items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createItemSchema.parse(body);

    const tagType = await prisma.tagType.findUnique({
      where: { slug: parsed.tagTypeSlug },
    });

    if (!tagType || !tagType.isActive) {
      return NextResponse.json(
        { error: "Invalid tag type" },
        { status: 400 }
      );
    }

    // Validate data against tag type field definitions
    const fieldGroups = tagType.fieldGroups as unknown as FieldGroupDefinition[];
    const dataSchema = buildItemDataSchema(fieldGroups);
    dataSchema.parse(parsed.data);

    const item = await prisma.item.create({
      data: {
        userId: session.user.id,
        tagTypeId: tagType.id,
        name: parsed.name,
        data: (parsed.data || {}) as any,
        photoUrls: parsed.photoUrls || [],
        primaryPhotoUrl: parsed.primaryPhotoUrl || null,
        ownerPhone: parsed.ownerPhone || null,
        ownerEmail: parsed.ownerEmail || null,
        ownerAddress: parsed.ownerAddress || null,
        rewardOffered: parsed.rewardOffered || false,
        rewardDetails: parsed.rewardDetails || null,
        visibility: (parsed.visibility || tagType.defaultVisibility || {}) as any,
      },
      include: {
        tagType: { select: { slug: true, name: true, icon: true, color: true } },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Create item error:", error);
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
