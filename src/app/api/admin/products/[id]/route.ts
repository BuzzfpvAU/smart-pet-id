import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, slug, price, compareAtPrice, tagQuantity, images, isActive, sortOrder } = body;

    if (slug) {
      const existing = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(slug !== undefined && { slug }),
        ...(price !== undefined && { price: Math.round(price) }),
        ...(compareAtPrice !== undefined && { compareAtPrice: compareAtPrice ? Math.round(compareAtPrice) : null }),
        ...(tagQuantity !== undefined && { tagQuantity }),
        ...(images !== undefined && { images }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin products PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin products DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
