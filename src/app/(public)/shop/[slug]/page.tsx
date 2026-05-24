"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";

interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string | null;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  tagQuantity: number;
  images: string[];
  metaTitle: string | null;
  metaDescription: string | null;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem, itemCount } = useCartStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) {
          setProduct(null);
          return;
        }
        const data = await res.json();
        setProduct(data.product);
        if (data.product?.metaTitle) {
          document.title = `${data.product.metaTitle} | Tagz.au`;
        } else if (data.product?.name) {
          document.title = `${data.product.name} | Tagz.au`;
        }
        if (data.product?.metaDescription) {
          const meta = document.querySelector('meta[name="description"]');
          if (meta) meta.setAttribute("content", data.product.metaDescription);
        }
      } catch {
        toast.error("Failed to load product");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  function handleAdd() {
    if (!product) return;
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

  if (isLoading) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Product not found</h1>
        <Link href="/shop">
          <Button variant="outline">Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice - product.price
      : null;

  return (
    <div className="container py-12 md:py-20">
      <Link
        href="/shop"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-xl overflow-hidden bg-muted/30">
            {product.images.length > 0 ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Tag className="w-24 h-24 text-accent/30" />
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    i === selectedImage
                      ? "border-accent"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <div className="flex items-start gap-3 mb-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              {product.name}
            </h1>
            {savings && (
              <Badge
                variant="secondary"
                className="bg-green-500/10 text-green-600 border-green-500/20 mt-2"
              >
                Save {formatPrice(savings)}
              </Badge>
            )}
          </div>

          <p className="text-lg text-muted-foreground mb-6">{product.description}</p>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display text-4xl font-bold">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">AUD inc. GST</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground mb-8">
            <Check className="h-5 w-5 text-accent" />
            <span>
              Includes {product.tagQuantity} smart tag
              {product.tagQuantity > 1 ? "s" : ""} with QR + NFC
            </span>
          </div>

          <div className="flex gap-3 mb-8">
            <Button
              size="lg"
              onClick={handleAdd}
              className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1 md:flex-none"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            {itemCount() > 0 && (
              <Link href="/cart">
                <Button size="lg" variant="outline">
                  View Cart ({itemCount()})
                </Button>
              </Link>
            )}
          </div>

          {product.longDescription && (
            <div className="border-t border-border/50 pt-8">
              <h2 className="font-display text-xl font-bold mb-4">Details</h2>
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                {product.longDescription.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
