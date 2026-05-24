import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let stripeProduct;
    if (product.stripeProductId) {
      stripeProduct = await stripe.products.update(product.stripeProductId, {
        name: product.name,
        description: product.description,
        active: product.isActive,
      });
    } else {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: { productId: product.id },
      });
    }

    if (product.stripePriceId) {
      const existingPrice = await stripe.prices.retrieve(product.stripePriceId);
      if (existingPrice.unit_amount === product.price) {
        const updated = await prisma.product.update({
          where: { id },
          data: { stripeProductId: stripeProduct.id },
        });
        return NextResponse.json({ product: updated });
      }
      await stripe.prices.update(product.stripePriceId, { active: false });
    }

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.price,
      currency: product.currency,
      metadata: { productId: product.id },
    });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("Stripe sync error:", error);
    return NextResponse.json({ error: "Failed to sync with Stripe" }, { status: 500 });
  }
}
