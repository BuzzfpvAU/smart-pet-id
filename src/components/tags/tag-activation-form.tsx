"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function TagActivationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code");
  const [code, setCode] = useState(codeParam || "");
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoSubmitted = useRef(false);

  // Auto-submit when code param is present (from scan → auth flow)
  useEffect(() => {
    if (codeParam && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      activateTag(codeParam);
    }
  }, [codeParam]);

  async function activateTag(activationCode: string) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/tags/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationCode }),
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await activateTag(code);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {codeParam && isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Activating your tag...</p>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
