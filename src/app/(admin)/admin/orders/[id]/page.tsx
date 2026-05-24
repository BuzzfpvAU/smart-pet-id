"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Product {
  name: string;
  tagQuantity: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tagCodes: string[];
  product: Product;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  name: string;
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
  stripePaymentIntentId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  orderItems: OrderItem[];
  user: { name: string | null; email: string } | null;
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

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/orders/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOrder(data.order);
        setTrackingNumber(data.order.trackingNumber || "");
        setNotes(data.order.notes || "");
      } catch {
        toast.error("Failed to load order");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  async function updateOrder(data: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setOrder((prev) => (prev ? { ...prev, ...result.order } : prev));
      toast.success("Order updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRefund() {
    setIsRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/refund`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setOrder((prev) => (prev ? { ...prev, ...result.order } : prev));
      setShowRefundDialog(false);
      toast.success("Refund processed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setIsRefunding(false);
    }
  }

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading order...</div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-muted-foreground">Order not found</div>;
  }

  const address = order.shippingAddress;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h2 className="font-display font-bold mb-3">Customer</h2>
            <p className="text-sm font-medium">{order.name}</p>
            <p className="text-sm text-muted-foreground">{order.email}</p>
          </CardContent>
        </Card>

        {address && (
          <Card className="border-border/50">
            <CardContent className="p-5">
              <h2 className="font-display font-bold mb-3">Shipping Address</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {address.line1}
                {address.line2 && <><br />{address.line2}</>}
                <br />
                {address.city}, {address.state} {address.postcode}
                <br />
                {address.country}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Activation Codes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="font-mono">{formatPrice(item.unitPrice)}</TableCell>
                  <TableCell className="font-mono">{formatPrice(item.totalPrice)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.tagCodes.map((code) => (
                        <code key={code} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                          {code}
                        </code>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-2">
            <h2 className="font-display font-bold mb-3">Totals</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping ({order.shippingMethod})</span>
              <span className="font-mono">{formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (included)</span>
              <span className="font-mono">{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-border/50">
              <span>Total</span>
              <span className="font-mono">{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <h2 className="font-display font-bold mb-3">Payment</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span>{order.paymentMethod || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stripe PI</span>
                <span className="font-mono text-xs">{order.stripePaymentIntentId || "—"}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid at</span>
                  <span>{new Date(order.paidAt).toLocaleString()}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipped at</span>
                  <span>{new Date(order.shippedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <div>
            <Label>Tracking Number</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateOrder({ trackingNumber })}
                disabled={isSaving}
              >
                Save
              </Button>
            </div>
          </div>
          <div>
            <Label>Admin Notes</Label>
            <div className="flex flex-col gap-2 mt-1">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={3}
              />
              <Button
                variant="outline"
                size="sm"
                className="self-end"
                onClick={() => updateOrder({ notes })}
                disabled={isSaving}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-5">
          <h2 className="font-display font-bold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {order.status === "PAID" && (
              <Button onClick={() => updateOrder({ status: "PROCESSING" })} disabled={isSaving}>
                Mark as Processing
              </Button>
            )}
            {order.status === "PROCESSING" && (
              <Button
                onClick={() => {
                  if (!trackingNumber) {
                    toast.error("Enter a tracking number first");
                    return;
                  }
                  updateOrder({ status: "SHIPPED", trackingNumber });
                }}
                disabled={isSaving}
              >
                Mark as Shipped
              </Button>
            )}
            {order.status === "SHIPPED" && (
              <Button onClick={() => updateOrder({ status: "DELIVERED" })} disabled={isSaving}>
                Mark as Delivered
              </Button>
            )}
            {(order.status === "PAID" || order.status === "PROCESSING") && (
              <Button
                variant="destructive"
                onClick={() => setShowRefundDialog(true)}
                disabled={isSaving}
              >
                Refund Order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Refund</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to refund order <span className="font-mono font-medium">{order.orderNumber}</span> for{" "}
            <span className="font-mono font-medium">{formatPrice(order.total)}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRefund} disabled={isRefunding}>
              {isRefunding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
