"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleCheckout() {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error("Prices have changed — cart updated. Please review.");
        if (data.updates) {
          const store = useCartStore.getState();
          for (const update of data.updates) {
            const item = store.items.find(
              (i) => i.productId === update.productId
            );
            if (item) {
              useCartStore.setState({
                items: store.items.map((i) =>
                  i.productId === update.productId
                    ? { ...i, price: update.newPrice }
                    : i
                ),
              });
            }
          }
        }
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Checkout failed");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">
          Your cart is empty
        </h1>
        <p className="text-muted-foreground mb-8">
          Add some smart tags to get started
        </p>
        <Link href="/shop">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Browse Shop
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-20 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/shop">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          Your Cart
        </h1>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <Card key={item.productId} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.tagQuantity} tag{item.tagQuantity > 1 ? "s" : ""} per
                  unit
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-mono">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right w-24">
                <span className="font-mono font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(item.price)} each
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.productId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{formatPrice(subtotal())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-muted-foreground text-xs">
              Calculated at checkout
            </span>
          </div>
          <div className="border-t border-border/50 pt-4 flex justify-between">
            <span className="font-display font-bold text-lg">Total</span>
            <span className="font-display font-bold text-lg font-mono">
              {formatPrice(subtotal())}
            </span>
          </div>
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
            onClick={handleCheckout}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You&apos;ll be redirected to our secure payment page
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
