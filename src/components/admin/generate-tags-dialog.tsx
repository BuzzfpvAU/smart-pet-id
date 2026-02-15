"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface GenerateTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: () => void;
}

export function GenerateTagsDialog({
  open,
  onOpenChange,
  onGenerated,
}: GenerateTagsDialogProps) {
  const [count, setCount] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: parseInt(count) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate tags");
        return;
      }

      setResult(data.codes);
      onGenerated();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setResult(null);
    setError("");
    setCount("10");
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {result ? "Tags Generated!" : "Generate Tag Codes"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {result
              ? `Successfully generated ${result.length} new tag codes. The codes and short URLs have been emailed to your account.`
              : "Create a batch of new activation codes for physical tags."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="max-h-64 overflow-y-auto rounded-md border p-3 bg-muted/50">
              {result.map((code, i) => (
                <div key={i} className="font-mono text-sm py-0.5">
                  {code}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(result.join("\n"));
              }}
            >
              Copy All Codes
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="count">Number of tags to generate</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum 500 tags per batch
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </AlertDialogCancel>
          {!result && (
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
