"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Check, Package, Truck } from "lucide-react";
import { toast } from "sonner";

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
  trackingNumber: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  orderItems: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  PAID: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PROCESSING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  SHIPPED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  DELIVERED: "bg-green-500/10 text-green-600 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
  REFUNDED: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const TIMELINE_STEPS = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function DashboardOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOrder(data.order);
      } catch {
        toast.error("Failed to load order");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

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
    return <div className="text-center py-20 text-muted-foreground">Loading order...</div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-muted-foreground">Order not found</div>;
  }

  const address = order.shippingAddress;
  const currentStepIdx = TIMELINE_STEPS.indexOf(order.status);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display font-mono">{order.orderNumber}</h1>
            <Badge variant="secondary" className={STATUS_COLORS[order.status] || ""}>
              {order.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {currentStepIdx >= 0 && (
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompleted
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-accent ring-offset-2" : ""}`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-xs ${isCompleted ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {step.charAt(0) + step.slice(1).toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-5">
          <h2 className="font-display font-bold mb-4">Items</h2>
          <div className="space-y-3">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product.name} × {item.quantity}</span>
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
          <CardContent className="p-5">
            <h2 className="font-display font-bold mb-2">Activation Codes</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use these codes to activate your tags.
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
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display font-bold">Shipping</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {address.line1}
              {address.line2 && <><br />{address.line2}</>}
              <br />
              {address.city}, {address.state} {address.postcode}
              <br />
              {address.country}
            </p>
            {order.trackingNumber && (
              <div className="mt-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{order.trackingNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
