import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        longDescription: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        currency: true,
        tagQuantity: true,
        images: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product detail GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
