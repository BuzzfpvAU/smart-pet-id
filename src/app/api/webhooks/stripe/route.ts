import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateTags } from "@/lib/tags";
import { sendOrderConfirmation } from "@/lib/email";
import crypto from "crypto";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(dispute);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { product: true } } },
  });

  if (!order || order.status !== "PENDING") return;

  const batchId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    for (const item of order.orderItems) {
      const tagCount = item.quantity * item.product.tagQuantity;
      const { codes } = await generateTags(tx, tagCount, batchId);

      await tx.orderItem.update({
        where: { id: item.id },
        data: { tagCodes: codes },
      });
    }

    const shippingCost = session.shipping_cost?.amount_total ?? 0;
    const shippingMethod = shippingCost >= 1000 ? "express" : "standard";

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent as string,
        paymentMethod: session.payment_method_types?.[0] ?? null,
        email: session.customer_details?.email ?? order.email,
        name: session.customer_details?.name ?? order.name,
        shipping: shippingCost,
        shippingMethod,
        total: order.subtotal + shippingCost,
        shippingAddress: session.collected_information?.shipping_details?.address
          ? {
              line1: session.collected_information.shipping_details.address.line1,
              line2: session.collected_information.shipping_details.address.line2,
              city: session.collected_information.shipping_details.address.city,
              state: session.collected_information.shipping_details.address.state,
              postcode: session.collected_information.shipping_details.address.postal_code,
              country: session.collected_information.shipping_details.address.country,
            }
          : undefined,
      },
    });
  });

  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { product: true } } },
  });

  if (updatedOrder) {
    try {
      await sendOrderConfirmation(updatedOrder);
    } catch (err) {
      console.error("Failed to send order confirmation email:", err);
    }
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntentId, status: { not: "REFUNDED" } },
    data: { status: "REFUNDED" },
  });
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId = dispute.payment_intent as string;
  if (!paymentIntentId) return;

  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: [order.notes, `⚠️ DISPUTE CREATED: ${dispute.reason} (${new Date().toISOString()})`]
          .filter(Boolean)
          .join("\n"),
      },
    });
  }
}
