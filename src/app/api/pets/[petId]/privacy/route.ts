import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { petId } = await params;
  const { privacyEnabled } = await req.json();

  const existing = await prisma.pet.findFirst({
    where: { id: petId, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const pet = await prisma.pet.update({
    where: { id: petId },
    data: { privacyEnabled: Boolean(privacyEnabled) },
  });

  return NextResponse.json(pet);
}
