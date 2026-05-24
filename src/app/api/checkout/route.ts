import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/orders";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const priceMismatches: { productId: string; expected: number; actual: number }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found or inactive` },
          { status: 400 }
        );
      }
      if (!product.stripePriceId) {
        return NextResponse.json(
          { error: `Product "${product.name}" is not yet available for purchase (not synced to Stripe)` },
          { status: 400 }
        );
      }
      if (product.price !== item.price) {
        priceMismatches.push({
          productId: item.productId,
          expected: item.price,
          actual: product.price,
        });
      }
    }

    if (priceMismatches.length > 0) {
      return NextResponse.json(
        {
          error: "Prices have changed",
          updates: priceMismatches.map((m) => ({
            productId: m.productId,
            newPrice: m.actual,
          })),
        },
        { status: 409 }
      );
    }

    let subtotal = 0;
    const orderItemsData = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)!;
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: lineTotal,
      };
    });

    const tax = Math.round(subtotal / 11);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? "pending@checkout",
        name: session?.user?.name ?? "Guest",
        status: "PENDING",
        subtotal,
        shipping: 0,
        tax,
        total: subtotal,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: { orderItems: true },
    });

    const lineItems = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)!;
      return {
        price: product.stripePriceId!,
        quantity: item.quantity,
      };
    });

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ["AU"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 500, currency: "aud" },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1000, currency: "aud" },
            display_name: "Express Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ],
      ...(session?.user?.email && { customer_email: session.user.email }),
      metadata: {
        orderId: order.id,
      },
      success_url: `${BASE_URL}/order/${order.id}/success`,
      cancel_url: `${BASE_URL}/cart`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url, orderId: order.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
