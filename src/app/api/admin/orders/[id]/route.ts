import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/orders";
import { sendShippingNotification } from "@/lib/email";
import { OrderStatus } from "@/generated/prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin order GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, trackingNumber, notes } = body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (status) {
      if (!canTransition(order.status, status as OrderStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from ${order.status} to ${status}` },
          { status: 400 }
        );
      }

      if (status === "SHIPPED" && !trackingNumber && !order.trackingNumber) {
        return NextResponse.json(
          { error: "Tracking number is required when marking as shipped" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "SHIPPED") updateData.shippedAt = new Date();

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    if (status === "SHIPPED" && (trackingNumber || order.trackingNumber)) {
      try {
        await sendShippingNotification({
          orderNumber: updated.orderNumber,
          email: updated.email,
          name: updated.name,
          trackingNumber: trackingNumber || order.trackingNumber!,
          shippingAddress: updated.shippingAddress,
          shippingMethod: updated.shippingMethod,
        });
      } catch (err) {
        console.error("Failed to send shipping notification:", err);
      }
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Admin order PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
