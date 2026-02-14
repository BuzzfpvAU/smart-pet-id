import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tagId } = await params;
  const body = await req.json();
  const { petId, itemId } = body;

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId: session.user.id },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // Link to item (new system)
  if (itemId) {
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId: session.user.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: { itemId, petId: null },
      include: {
        item: { select: { id: true, name: true, tagType: { select: { name: true } } } },
      },
    });

    return NextResponse.json(updatedTag);
  }

  // Link to pet (legacy/backward compat)
  if (petId) {
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: session.user.id },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: { petId, itemId: null },
      include: { pet: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updatedTag);
  }

  return NextResponse.json(
    { error: "Either petId or itemId is required" },
    { status: 400 }
  );
}
