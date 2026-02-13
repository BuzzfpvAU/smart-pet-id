import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTagScanUrl } from "@/lib/qrcode";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { activationCode } = await req.json();

    if (!activationCode) {
      return NextResponse.json(
        { error: "Activation code is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.findUnique({
      where: { activationCode: activationCode.trim().toUpperCase() },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "Invalid activation code" },
        { status: 404 }
      );
    }

    if (tag.status === "active") {
      return NextResponse.json(
        { error: "This tag is already activated" },
        { status: 409 }
      );
    }

    if (tag.status === "deactivated") {
      return NextResponse.json(
        { error: "This tag has been deactivated" },
        { status: 400 }
      );
    }

    const qrCodeUrl = getTagScanUrl(tag.id);

    const updatedTag = await prisma.tag.update({
      where: { id: tag.id },
      data: {
        userId: session.user.id,
        status: "active",
        qrCodeUrl,
        activatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error("Activate tag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
