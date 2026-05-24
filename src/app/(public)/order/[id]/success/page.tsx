"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, XCircle, Copy, Check, Package } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tagCodes: string[];
  product: { name: string; slug: string; tagQuantity: number };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  name: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  } | null;
  shippingMethod: string;
  orderItems: OrderItem[];
}

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const clearCart = useCartStore((s) => s.clearCart);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.order as Order;
    } catch {
      return null;
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    let stopped = false;

    async function poll() {
      const data = await fetchOrder();
      if (stopped) return;

      if (data) {
        setOrder(data);
        setIsLoading(false);

        if (data.status !== "PENDING") {
          clearInterval(interval);
          if (data.status === "PAID") {
            clearCart();
          }
        }
      }
    }

    poll();
    interval = setInterval(poll, 2000);

    timeout = setTimeout(() => {
      if (!stopped) {
        setTimedOut(true);
        clearInterval(interval);
        setIsLoading(false);
        clearCart();
      }
    }, 30000);

    return () => {
      stopped = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [fetchOrder, clearCart]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Code copied!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">Processing your payment...</h1>
        <p className="text-muted-foreground">This usually takes just a few seconds.</p>
      </div>
    );
  }

  if (timedOut && (!order || order.status === "PENDING")) {
    return (
      <div className="container py-20 text-center max-w-lg">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">Payment received!</h1>
        <p className="text-muted-foreground mb-8">
          Your confirmation email with activation codes is on its way. It may take a minute to arrive.
        </p>
        <Link href="/dashboard">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (order?.status === "CANCELLED") {
    return (
      <div className="container py-20 text-center max-w-lg">
        <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">Payment was not completed</h1>
        <p className="text-muted-foreground mb-8">
          Your order was cancelled. No charges were made.
        </p>
        <Link href="/shop">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Return to Shop
          </Button>
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const address = order.shippingAddress;

  return (
    <div className="container py-12 md:py-20 max-w-2xl">
      <div className="text-center mb-10">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          Order <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <h2 className="font-display font-bold mb-4">Order Summary</h2>
            <div className="space-y-3">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-mono">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
              <div className="border-t border-border/50 pt-3 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping ({order.shippingMethod})</span>
                  <span className="font-mono">{formatPrice(order.shipping)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>GST (included)</span>
                  <span className="font-mono">{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-border/50">
                  <span>Total</span>
                  <span className="font-mono">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.orderItems.some((item) => item.tagCodes.length > 0) && (
          <Card className="border-border/50">
            <CardContent className="p-6">
              <h2 className="font-display font-bold mb-2">Your Activation Codes</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Use these codes to activate your tags in your dashboard.
              </p>
              <div className="space-y-2">
                {order.orderItems.flatMap((item) =>
                  item.tagCodes.map((code) => (
                    <div
                      key={code}
                      className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5"
                    >
                      <span className="font-mono font-medium tracking-wider">{code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyCode(code)}
                      >
                        {copiedCode === code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {address && (
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display font-bold">Shipping To</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {address.line1}
                {address.line2 && <><br />{address.line2}</>}
                <br />
                {address.city}, {address.state} {address.postcode}
                <br />
                {address.country}
              </p>
              <Badge variant="secondary" className="mt-3">
                {order.shippingMethod === "express"
                  ? "Express: 1–3 business days"
                  : "Standard: 3–7 business days"}
              </Badge>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link href="/dashboard/tags" className="flex-1">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Activate Your Tags
            </Button>
          </Link>
          <Link href="/shop" className="flex-1">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
