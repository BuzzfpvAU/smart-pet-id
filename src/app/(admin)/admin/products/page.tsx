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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Pencil, Trash2, Upload, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

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
  isActive: boolean;
  sortOrder: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
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
  const [formLongDescription, setFormLongDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCompareAtPrice, setFormCompareAtPrice] = useState("");
  const [formTagQuantity, setFormTagQuantity] = useState("1");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDescription, setFormMetaDescription] = useState("");
  const [formMetaKeywords, setFormMetaKeywords] = useState("");
  const [uploading, setUploading] = useState(false);

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
    setFormLongDescription("");
    setFormPrice("");
    setFormCompareAtPrice("");
    setFormTagQuantity("1");
    setFormImages([]);
    setFormMetaTitle("");
    setFormMetaDescription("");
    setFormMetaKeywords("");
    setEditProduct(null);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormDescription(product.description);
    setFormLongDescription(product.longDescription || "");
    setFormPrice((product.price / 100).toFixed(2));
    setFormCompareAtPrice(
      product.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : ""
    );
    setFormTagQuantity(String(product.tagQuantity));
    setFormImages(product.images);
    setFormMetaTitle(product.metaTitle || "");
    setFormMetaDescription(product.metaDescription || "");
    setFormMetaKeywords(product.metaKeywords || "");
    setEditProduct(product);
    setDialogOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Upload failed");
          continue;
        }
        const { url } = await res.json();
        setFormImages((prev) => [...prev, url]);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
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
      longDescription: formLongDescription,
      price,
      compareAtPrice,
      tagQuantity: parseInt(formTagQuantity) || 1,
      images: formImages,
      metaTitle: formMetaTitle,
      metaDescription: formMetaDescription,
      metaKeywords: formMetaKeywords,
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
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted/30 flex-shrink-0">
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted/30 flex items-center justify-center flex-shrink-0">
                            <ImagePlus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <p className="text-xs text-muted-foreground">
                            {product.slug}
                          </p>
                        </div>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editProduct ? `Edit ${editProduct.name}` : "New Product"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="images" className="flex-1">Images</TabsTrigger>
              <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
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
                <Label>Short Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief summary shown on the shop page"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={formLongDescription}
                  onChange={(e) => setFormLongDescription(e.target.value)}
                  placeholder="Detailed product description shown on the product page. Separate paragraphs with blank lines."
                  rows={6}
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
            </TabsContent>

            <TabsContent value="images" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                {formImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted/30 group">
                    <Image src={img} alt={`Product ${i + 1}`} fill className="object-cover" sizes="200px" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-border/50 hover:border-accent/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">
                    {uploading ? "Uploading..." : "Add Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                First image is the main product photo. JPEG, PNG, or WebP. Max 5MB each.
              </p>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  placeholder="e.g., Buy 3-Pack Smart Tags | QR + NFC Tags Australia"
                  maxLength={70}
                />
                <p className="text-xs text-muted-foreground">
                  {formMetaTitle.length}/70 characters. Shows in search results and browser tab.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={formMetaDescription}
                  onChange={(e) => setFormMetaDescription(e.target.value)}
                  placeholder="e.g., Save on 3 QR + NFC smart tags. Track pets, keys, luggage and more. Free activation, instant setup. Ships Australia-wide."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {formMetaDescription.length}/160 characters. Shows below the title in search results.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input
                  value={formMetaKeywords}
                  onChange={(e) => setFormMetaKeywords(e.target.value)}
                  placeholder="e.g., smart tags, QR tags, NFC tags, pet tracker, luggage tag"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords for search engine optimization.
                </p>
              </div>

              {formMetaTitle || formMetaDescription ? (
                <div className="border border-border/50 rounded-lg p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Search Preview</p>
                  <p className="text-blue-600 dark:text-blue-400 text-base font-medium truncate">
                    {formMetaTitle || formName || "Product Title"} | Tagz.au
                  </p>
                  <p className="text-green-700 dark:text-green-500 text-sm truncate">
                    tagz.au/shop/{formSlug || "product-slug"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {formMetaDescription || formDescription || "Product description will appear here."}
                  </p>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>

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
