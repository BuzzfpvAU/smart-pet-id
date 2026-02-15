"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Phone,
  Mail,
  MapPin,
  QrCode,
  Check,
  ClipboardCheck,
  Loader2,
  Heart,
  Gift,
  User,
} from "lucide-react";

interface ChecklistItemDef {
  id: string;
  label: string;
  type: "checkbox" | "number" | "text";
  required: boolean;
}

interface ChecklistProfile {
  name: string;
  tagType: {
    slug: string;
    name: string;
    icon: string;
    color: string;
  };
  data: Record<string, unknown>;
  photoUrls: string[];
  primaryPhotoUrl: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  ownerAddress: string | null;
  rewardOffered: boolean;
  rewardDetails: string | null;
}

export function ChecklistScanPage({
  tagId,
  item,
}: {
  tagId: string;
  item: ChecklistProfile;
}) {
  const checklistItems = (item.data.checklistItems as ChecklistItemDef[]) || [];
  const description = (item.data.description as string) || "";

  const [scannerName, setScannerName] = useState("");
  const [scannerEmail, setScannerEmail] = useState("");
  const [results, setResults] = useState<
    Record<string, boolean | number | string>
  >(() => {
    const initial: Record<string, boolean | number | string> = {};
    for (const ci of checklistItems) {
      if (ci.type === "checkbox") initial[ci.id] = false;
      else if (ci.type === "number") initial[ci.id] = "";
      else initial[ci.id] = "";
    }
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Auto-request location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("granted");
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  function updateResult(id: string, value: boolean | number | string) {
    setResults((prev) => ({ ...prev, [id]: value }));
    // Clear error when user fills in a value
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!scannerName.trim()) {
      newErrors["scannerName"] = "Name is required";
    }

    for (const ci of checklistItems) {
      if (ci.required) {
        const val = results[ci.id];
        if (ci.type === "checkbox" && val !== true) {
          newErrors[ci.id] = "This item is required";
        } else if (ci.type === "number" && (val === "" || val === undefined)) {
          newErrors[ci.id] = "This field is required";
        } else if (
          ci.type === "text" &&
          (!val || (typeof val === "string" && !val.trim()))
        ) {
          newErrors[ci.id] = "This field is required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Build results array
      const resultsArray = checklistItems.map((ci) => ({
        id: ci.id,
        label: ci.label,
        type: ci.type,
        value: results[ci.id],
      }));

      const res = await fetch(`/api/scan/${tagId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: resultsArray,
          scannerName: scannerName.trim(),
          scannerEmail: scannerEmail.trim() || null,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to submit checklist");
        return;
      }

      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="text-white p-4 text-center"
          style={{ backgroundColor: item.tagType.color }}
        >
          <div className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5" />
            <span className="font-semibold">Tagz.au</span>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4 space-y-4">
          <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                Checklist Submitted
              </h2>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your checklist for <strong>{item.name}</strong> has been
                recorded. The owner has been notified.
              </p>
            </CardContent>
          </Card>

          {/* Owner Contact (post-submission) */}
          {item.ownerPhone && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Owner Contact
                </h2>
                {item.ownerPhone && (
                  <a
                    href={`tel:${item.ownerPhone}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {item.ownerPhone}
                  </a>
                )}
                {item.ownerEmail && (
                  <a
                    href={`mailto:${item.ownerEmail}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {item.ownerEmail}
                  </a>
                )}
                {item.ownerAddress && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {item.ownerAddress}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground py-4">
            Powered by Tagz.au
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="text-white p-4 text-center"
        style={{ backgroundColor: item.tagType.color }}
      >
        <div className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          <span className="font-semibold">Tagz.au</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Item Info */}
        <div className="text-center">
          {item.primaryPhotoUrl ? (
            <img
              src={item.primaryPhotoUrl}
              alt={item.name}
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 mb-3"
              style={{ borderColor: item.tagType.color + "40" }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ backgroundColor: item.tagType.color + "15" }}
            >
              <ClipboardCheck
                className="h-10 w-10"
                style={{ color: item.tagType.color + "50" }}
              />
            </div>
          )}
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <Badge
            className="mt-2"
            style={{
              backgroundColor: item.tagType.color + "15",
              color: item.tagType.color,
            }}
          >
            Checklist
          </Badge>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>

        {/* Reward Offer */}
        {item.rewardOffered && item.rewardDetails && (
          <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-green-600" />
                <h2 className="font-semibold text-green-800 dark:text-green-200">
                  Reward Offered
                </h2>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {item.rewardDetails}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Checklist Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conducted By */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Conducted By
              </h3>
              <div className="space-y-2">
                <Label htmlFor="scannerName">Name *</Label>
                <Input
                  id="scannerName"
                  placeholder="Your name"
                  value={scannerName}
                  onChange={(e) => {
                    setScannerName(e.target.value);
                    if (errors.scannerName) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.scannerName;
                        return next;
                      });
                    }
                  }}
                />
                {errors.scannerName && (
                  <p className="text-xs text-destructive">{errors.scannerName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="scannerEmail">Email (optional)</Label>
                <Input
                  id="scannerEmail"
                  type="email"
                  placeholder="Your email"
                  value={scannerEmail}
                  onChange={(e) => setScannerEmail(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Checklist Items */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Checklist
              </h3>

              {checklistItems.map((ci) => (
                <div key={ci.id} className="space-y-1">
                  {ci.type === "checkbox" ? (
                    <div className="flex items-center justify-between py-1">
                      <Label
                        htmlFor={ci.id}
                        className="text-sm flex items-center gap-1"
                      >
                        {ci.label}
                        {ci.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                      <Switch
                        id={ci.id}
                        checked={!!results[ci.id]}
                        onCheckedChange={(v) => updateResult(ci.id, v)}
                      />
                    </div>
                  ) : ci.type === "number" ? (
                    <div className="space-y-1">
                      <Label htmlFor={ci.id} className="text-sm">
                        {ci.label}
                        {ci.required && (
                          <span className="text-destructive"> *</span>
                        )}
                      </Label>
                      <Input
                        id={ci.id}
                        type="number"
                        placeholder={`Enter ${ci.label.toLowerCase()}`}
                        value={results[ci.id] as string}
                        onChange={(e) => updateResult(ci.id, e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor={ci.id} className="text-sm">
                        {ci.label}
                        {ci.required && (
                          <span className="text-destructive"> *</span>
                        )}
                      </Label>
                      <Input
                        id={ci.id}
                        placeholder={`Enter ${ci.label.toLowerCase()}`}
                        value={results[ci.id] as string}
                        onChange={(e) => updateResult(ci.id, e.target.value)}
                      />
                    </div>
                  )}
                  {errors[ci.id] && (
                    <p className="text-xs text-destructive">{errors[ci.id]}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Location Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                {locationStatus === "requesting" && (
                  <span className="text-muted-foreground">
                    Getting your location...
                  </span>
                )}
                {locationStatus === "granted" && (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Location captured
                  </span>
                )}
                {locationStatus === "denied" && (
                  <span className="text-muted-foreground">
                    Location not available
                  </span>
                )}
                {locationStatus === "idle" && (
                  <span className="text-muted-foreground">
                    Location pending...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-6 text-lg"
            disabled={isSubmitting}
            style={{ backgroundColor: item.tagType.color }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Submit Checklist
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground py-4">
          Powered by Tagz.au
        </p>
      </div>
    </div>
  );
}
