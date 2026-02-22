import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { madeLive } = await req.json();

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        madeLive,
        madeLiveAt: madeLive ? new Date() : null,
      },
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Admin tag made-live PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
