"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function B2BPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    website: "",
    address: "",
    currentProducts: "",
    neededProducts: "",
    salesMethods: "",
    targetArea: "",
    orderVolume: "",
    priority: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/contact/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Inquiry submitted! We'll be in touch.");
        setForm({
          name: "",
          email: "",
          phone: "",
          message: "",
          website: "",
          address: "",
          currentProducts: "",
          neededProducts: "",
          salesMethods: "",
          targetArea: "",
          orderVolume: "",
          priority: "",
        });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit inquiry");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container max-w-2xl py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">B2B / Wholesale</h1>
        <p className="text-muted-foreground mt-2">
          Interested in selling Tagz.au tags? Tell us about your business.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wholesale Inquiry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentProducts">Current Products Sold</Label>
              <Input
                id="currentProducts"
                value={form.currentProducts}
                onChange={(e) => update("currentProducts", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neededProducts">Products Needed</Label>
              <Input
                id="neededProducts"
                value={form.neededProducts}
                onChange={(e) => update("neededProducts", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetArea">Target Market/Area</Label>
                <Input
                  id="targetArea"
                  value={form.targetArea}
                  onChange={(e) => update("targetArea", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderVolume">Expected Order Volume</Label>
                <Input
                  id="orderVolume"
                  value={form.orderVolume}
                  onChange={(e) => update("orderVolume", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Additional Message *</Label>
              <Textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
