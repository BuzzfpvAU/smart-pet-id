import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { orderItems: true } },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, longDescription, slug, price, compareAtPrice, tagQuantity, images, metaTitle, metaDescription, metaKeywords } = body;

    if (!name || !slug || !price) {
      return NextResponse.json({ error: "Name, slug, and price are required" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
    }

    const maxSort = await prisma.product.aggregate({ _max: { sortOrder: true } });

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        longDescription: longDescription || null,
        slug,
        price: Math.round(price),
        compareAtPrice: compareAtPrice ? Math.round(compareAtPrice) : null,
        tagQuantity: tagQuantity || 1,
        images: images || [],
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Admin products POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
