import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ typeId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { typeId } = await params;
    const tagType = await prisma.tagType.findUnique({
      where: { id: typeId },
      include: { _count: { select: { items: true } } },
    });

    if (!tagType) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(tagType);
  } catch (error) {
    console.error("Get tag type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ typeId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { typeId } = await params;
    const body = await req.json();

    const tagType = await prisma.tagType.update({
      where: { id: typeId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.fieldGroups !== undefined && { fieldGroups: body.fieldGroups }),
        ...(body.defaultVisibility !== undefined && { defaultVisibility: body.defaultVisibility }),
      },
    });

    return NextResponse.json(tagType);
  } catch (error) {
    console.error("Update tag type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ typeId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { typeId } = await params;

    const itemCount = await prisma.item.count({
      where: { tagTypeId: typeId },
    });

    if (itemCount > 0) {
      // Soft delete - deactivate instead of deleting
      const tagType = await prisma.tagType.update({
        where: { id: typeId },
        data: { isActive: false },
      });
      return NextResponse.json({ ...tagType, deactivated: true });
    }

    await prisma.tagType.delete({ where: { id: typeId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tag type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
