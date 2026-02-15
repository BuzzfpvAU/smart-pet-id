import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const templates = await prisma.checklistTemplate.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("List checklist templates error:", error);
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
    const { name, description, icon, color, items } = body;

    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Name and items are required" },
        { status: 400 }
      );
    }

    const maxSort = await prisma.checklistTemplate.aggregate({
      _max: { sortOrder: true },
    });

    const template = await prisma.checklistTemplate.create({
      data: {
        name,
        description: description || null,
        icon: icon || "clipboard-check",
        color: color || "#0ea5e9",
        items: items as any,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Create checklist template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
