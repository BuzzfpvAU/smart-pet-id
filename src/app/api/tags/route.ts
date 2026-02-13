import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: {
      pet: { select: { id: true, name: true, species: true } },
      _count: { select: { scans: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tags);
}
