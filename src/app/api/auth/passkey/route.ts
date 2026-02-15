import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List user's passkeys
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const passkeys = await prisma.passkey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        deviceName: true,
        credentialDeviceType: true,
        credentialBackedUp: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ passkeys });
  } catch (error) {
    console.error("List passkeys error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a passkey
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { passkeyId } = await req.json();

    if (!passkeyId) {
      return NextResponse.json(
        { error: "Passkey ID required" },
        { status: 400 }
      );
    }

    // Verify passkey belongs to user
    const passkey = await prisma.passkey.findFirst({
      where: { id: passkeyId, userId: session.user.id },
    });

    if (!passkey) {
      return NextResponse.json(
        { error: "Passkey not found" },
        { status: 404 }
      );
    }

    await prisma.passkey.delete({
      where: { id: passkeyId },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete passkey error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
