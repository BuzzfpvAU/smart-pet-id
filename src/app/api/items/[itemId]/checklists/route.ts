import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Verify item belongs to user
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId: session.user.id },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.checklistSubmission.findMany({
        where: { itemId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.checklistSubmission.count({
        where: { itemId },
      }),
    ]);

    return NextResponse.json({
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get checklist submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
