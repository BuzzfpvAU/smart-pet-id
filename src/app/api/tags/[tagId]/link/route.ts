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
  const { petId } = await req.json();

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId: session.user.id },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const pet = await prisma.pet.findFirst({
    where: { id: petId, userId: session.user.id },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const updatedTag = await prisma.tag.update({
    where: { id: tagId },
    data: { petId },
    include: { pet: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updatedTag);
}
