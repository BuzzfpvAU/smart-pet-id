import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const tagTypes = await prisma.tagType.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(tagTypes);
  } catch (error) {
    console.error("List tag types error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, icon, color, fieldGroups, defaultVisibility } = body;

    if (!name || !slug || !fieldGroups) {
      return NextResponse.json(
        { error: "Name, slug, and fieldGroups are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.tagType.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A tag type with this slug already exists" },
        { status: 409 }
      );
    }

    const maxSort = await prisma.tagType.aggregate({
      _max: { sortOrder: true },
    });

    const tagType = await prisma.tagType.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || "tag",
        color: color || "#6366f1",
        fieldGroups,
        defaultVisibility: defaultVisibility || {},
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json(tagType);
  } catch (error) {
    console.error("Create tag type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
