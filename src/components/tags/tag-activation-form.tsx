"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function TagActivationForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/tags/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to activate tag");
        return;
      }

      toast.success("Tag activated! Now let's set it up.");
      router.push(`/dashboard/items/new?tagId=${data.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Activation Code</Label>
            <Input
              id="code"
              placeholder="XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="text-center text-lg tracking-wider font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Find this code on the card or packaging that came with your tag.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Activating..." : "Activate Tag"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
