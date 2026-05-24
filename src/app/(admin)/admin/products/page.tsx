"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, RefreshCw, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

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
  isActive: boolean;
  sortOrder: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
  _count: { orderItems: number };
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCompareAtPrice, setFormCompareAtPrice] = useState("");
  const [formTagQuantity, setFormTagQuantity] = useState("1");

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openCreate() {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormPrice("");
    setFormCompareAtPrice("");
    setFormTagQuantity("1");
    setEditProduct(null);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormDescription(product.description);
    setFormPrice((product.price / 100).toFixed(2));
    setFormCompareAtPrice(
      product.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : ""
    );
    setFormTagQuantity(String(product.tagQuantity));
    setEditProduct(product);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const price = Math.round(parseFloat(formPrice) * 100);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const compareAtPrice = formCompareAtPrice
      ? Math.round(parseFloat(formCompareAtPrice) * 100)
      : null;

    const body = {
      name: formName,
      slug: formSlug,
      description: formDescription,
      price,
      compareAtPrice,
      tagQuantity: parseInt(formTagQuantity) || 1,
    };

    try {
      const url = editProduct
        ? `/api/admin/products/${editProduct.id}`
        : "/api/admin/products";
      const method = editProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
        return;
      }

      toast.success(editProduct ? "Product updated" : "Product created");
      setDialogOpen(false);
      fetchProducts();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function toggleActive(product: Product) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (res.ok) {
        toast.success(
          product.isActive ? "Product deactivated" : "Product activated"
        );
        fetchProducts();
      }
    } catch {
      toast.error("Failed to update");
    }
  }

  async function deactivate(product: Product) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Product deactivated");
        fetchProducts();
      }
    } catch {
      toast.error("Failed to deactivate");
    }
  }

  async function syncToStripe(product: Product) {
    setSyncing(product.id);
    try {
      const res = await fetch(
        `/api/admin/products/${product.id}/sync-stripe`,
        { method: "POST" }
      );

      if (res.ok) {
        toast.success("Synced to Stripe");
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Products
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage tag products and pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchProducts}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Product
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Product
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Price
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Orders
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stripe
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No products yet. Create your first product to start selling.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-accent/5">
                    <TableCell>
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {product.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-mono">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-2">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.tagQuantity}</TableCell>
                    <TableCell>{product._count.orderItems}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.stripePriceId ? "default" : "secondary"
                        }
                      >
                        {product.stripePriceId ? "Synced" : "Not synced"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(product)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => syncToStripe(product)}
                          disabled={syncing === product.id}
                          title="Sync to Stripe"
                        >
                          <Upload
                            className={`h-4 w-4 ${syncing === product.id ? "animate-pulse" : ""}`}
                          />
                        </Button>
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => toggleActive(product)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deactivate(product)}
                          title="Deactivate"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editProduct ? `Edit ${editProduct.name}` : "New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editProduct) {
                      setFormSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                      );
                    }
                  }}
                  placeholder="e.g., 3-Pack Smart Tags"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g., 3-pack"
                  disabled={!!editProduct}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Short description of this product"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price (AUD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="15.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Compare at</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCompareAtPrice}
                  onChange={(e) => setFormCompareAtPrice(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Tag Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={formTagQuantity}
                  onChange={(e) => setFormTagQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editProduct ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
