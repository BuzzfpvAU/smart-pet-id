"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, Check } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";

interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  tagQuantity: number;
  images: string[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem, itemCount } = useCartStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data.products);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function handleAdd(product: Product) {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      tagQuantity: product.tagQuantity,
      image: product.images[0] || "",
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <div className="container py-12 md:py-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Shop Smart Tags
          </h1>
          <p className="text-muted-foreground mt-2">
            QR + NFC combo tags for everything you value
          </p>
        </div>
        <Link href="/cart">
          <Button variant="outline" className="relative">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {itemCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {itemCount()}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No products available yet. Check back soon!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const savings =
              product.compareAtPrice && product.compareAtPrice > product.price
                ? product.compareAtPrice - product.price
                : null;

            return (
              <Card
                key={product.id}
                className="overflow-hidden border-border/50 hover:border-accent/30 transition-colors"
              >
                <div className="bg-muted/30 p-8 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Tag className="w-10 h-10 text-accent" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-display text-xl font-bold">
                      {product.name}
                    </h2>
                    {savings && (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        Save {formatPrice(savings)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Check className="h-4 w-4 text-accent" />
                    <span>
                      Includes {product.tagQuantity} tag
                      {product.tagQuantity > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="font-display text-2xl font-bold">
                        {formatPrice(product.price)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground block">
                        AUD inc. GST
                      </span>
                    </div>
                    <Button
                      onClick={() => handleAdd(product)}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
