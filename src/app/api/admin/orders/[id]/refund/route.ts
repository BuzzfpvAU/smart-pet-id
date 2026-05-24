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
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json({ error: "No payment to refund" }, { status: 400 });
    }

    if (order.status === "REFUNDED") {
      return NextResponse.json({ error: "Order already refunded" }, { status: 400 });
    }

    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "REFUNDED",
        notes: [order.notes, `Refunded by ${session.user.email} on ${new Date().toISOString()}`]
          .filter(Boolean)
          .join("\n"),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}
