import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { petSchema } from "@/lib/validation";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { petId } = await params;

  const pet = await prisma.pet.findFirst({
    where: { id: petId, userId: session.user.id },
    include: {
      tags: {
        select: { id: true, activationCode: true, status: true, qrCodeUrl: true },
      },
    },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  return NextResponse.json(pet);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { petId } = await params;

  const existing = await prisma.pet.findFirst({
    where: { id: petId, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = petSchema.partial().parse(body);

    const pet = await prisma.pet.update({
      where: { id: petId },
      data: {
        ...data,
        ownerEmail: data.ownerEmail || undefined,
      },
    });

    return NextResponse.json(pet);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Update pet error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { petId } = await params;

  const existing = await prisma.pet.findFirst({
    where: { id: petId, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  await prisma.pet.delete({ where: { id: petId } });

  return NextResponse.json({ success: true });
}
