"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Phone,
  Mail,
  MapPin,
  Navigation,
  QrCode,
  Check,
  ClipboardCheck,
  Loader2,
  Heart,
  Gift,
  User,
  Send,
  ArrowLeft,
  Search,
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

type PageMode = "choose" | "found" | "checklist";

export function ChecklistScanPage({
  tagId,
  item,
}: {
  tagId: string;
  item: ChecklistProfile;
}) {
  const [mode, setMode] = useState<PageMode>("choose");

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

      {mode === "choose" && (
        <ChoosePage item={item} onChoose={setMode} tagId={tagId} />
      )}
      {mode === "found" && (
        <FoundItemPage item={item} tagId={tagId} onBack={() => setMode("choose")} />
      )}
      {mode === "checklist" && (
        <ChecklistFormPage item={item} tagId={tagId} onBack={() => setMode("choose")} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Decision / Landing Page
   ───────────────────────────────────────────── */

function ChoosePage({
  item,
  onChoose,
  tagId,
}: {
  item: ChecklistProfile;
  onChoose: (mode: PageMode) => void;
  tagId: string;
}) {
  const description = (item.data.description as string) || "";

  // Log the scan on mount
  useEffect(() => {
    fetch(`/api/scan/${tagId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: null, longitude: null }),
    }).catch(() => {});
  }, [tagId]);

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Item Info */}
      <div className="text-center pt-2">
        {item.primaryPhotoUrl ? (
          <img
            src={item.primaryPhotoUrl}
            alt={item.name}
            className="w-28 h-28 rounded-full mx-auto object-cover border-4 mb-3"
            style={{ borderColor: item.tagType.color + "40" }}
          />
        ) : (
          <div
            className="w-28 h-28 rounded-full mx-auto flex items-center justify-center mb-3"
            style={{ backgroundColor: item.tagType.color + "15" }}
          >
            <ClipboardCheck
              className="h-12 w-12"
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

      <Separator />

      {/* Two choices */}
      <div className="space-y-3 pt-2">
        <p className="text-center text-sm font-medium text-muted-foreground">
          What would you like to do?
        </p>

        <Button
          onClick={() => onChoose("found")}
          variant="outline"
          className="w-full py-8 text-left flex items-start gap-4 h-auto"
        >
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: item.tagType.color + "15" }}
          >
            <Search className="h-6 w-6" style={{ color: item.tagType.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base">I found this item</p>
            <p className="text-sm text-muted-foreground font-normal">
              Contact the owner and share your location
            </p>
          </div>
        </Button>

        <Button
          onClick={() => onChoose("checklist")}
          className="w-full py-8 text-left flex items-start gap-4 h-auto"
          style={{ backgroundColor: item.tagType.color }}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-white/20">
            <ClipboardCheck className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base">Complete Checklist</p>
            <p className="text-sm font-normal opacity-90">
              Fill out and submit the inspection checklist
            </p>
          </div>
        </Button>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground py-4">
        Powered by Tagz.au
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Found Item Page (contact owner, share location)
   ───────────────────────────────────────────── */

function FoundItemPage({
  item,
  tagId,
  onBack,
}: {
  item: ChecklistProfile;
  tagId: string;
  onBack: () => void;
}) {
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [finderPhone, setFinderPhone] = useState("");
  const [finderMessage, setFinderMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  const shareLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    setLocationStatus("requesting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationStatus("granted");
        await fetch(`/api/scan/${tagId}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [tagId]);

  async function sendContact(e: React.FormEvent) {
    e.preventDefault();
    if (!finderPhone) return;

    await fetch(`/api/scan/${tagId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: finderPhone,
        message: finderMessage,
      }),
    });

    setContactSent(true);
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-1 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Item header (compact) */}
      <div className="flex items-center gap-3">
        {item.primaryPhotoUrl ? (
          <img
            src={item.primaryPhotoUrl}
            alt={item.name}
            className="w-14 h-14 rounded-full object-cover border-2"
            style={{ borderColor: item.tagType.color + "40" }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: item.tagType.color + "15" }}
          >
            <ClipboardCheck
              className="h-6 w-6"
              style={{ color: item.tagType.color + "50" }}
            />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">{item.name}</h1>
          <p className="text-sm text-muted-foreground">Found this item?</p>
        </div>
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

      {/* Owner Contact */}
      {item.ownerPhone && (
        <>
          <a
            href={`tel:${item.ownerPhone}`}
            className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-xl p-5 text-lg font-semibold transition-colors"
          >
            <Phone className="h-6 w-6" />
            Call Owner
          </a>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Owner Contact
              </h2>
              <a
                href={`tel:${item.ownerPhone}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {item.ownerPhone}
              </a>
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
        </>
      )}

      {!item.ownerPhone && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              The owner&apos;s contact information is not available.
              You can still share your location and leave your phone number
              below.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Share Location */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Share your location
          </h3>
          {locationStatus === "idle" && (
            <Button onClick={shareLocation} className="w-full" variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Share My Location
            </Button>
          )}
          {locationStatus === "requesting" && (
            <p className="text-sm text-muted-foreground text-center">
              Requesting your location...
            </p>
          )}
          {locationStatus === "granted" && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <p className="text-sm">
                Location shared. The owner has been notified.
              </p>
            </div>
          )}
          {locationStatus === "denied" && (
            <p className="text-sm text-muted-foreground">
              Location access denied. You can still leave your phone number
              below.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Finder Contact Form */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Leave Your Contact Info
          </h3>
          {contactSent ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <p className="text-sm">
                Your contact info has been sent to the owner. Thank you!
              </p>
            </div>
          ) : (
            <form onSubmit={sendContact} className="space-y-3">
              <Input
                type="tel"
                placeholder="Your phone number"
                value={finderPhone}
                onChange={(e) => setFinderPhone(e.target.value)}
                required
              />
              <Textarea
                placeholder="Optional message (e.g., where you found the item)"
                value={finderMessage}
                onChange={(e) => setFinderMessage(e.target.value)}
                rows={2}
              />
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send to Owner
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground py-4">
        Powered by Tagz.au
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Checklist Form Page
   ───────────────────────────────────────────── */

function ChecklistFormPage({
  item,
  tagId,
  onBack,
}: {
  item: ChecklistProfile;
  tagId: string;
  onBack: () => void;
}) {
  const checklistItems = (item.data.checklistItems as ChecklistItemDef[]) || [];

  const [scannerName, setScannerName] = useState("");
  const [scannerEmail, setScannerEmail] = useState("");
  const [results, setResults] = useState<
    Record<string, boolean | number | string>
  >(() => {
    const initial: Record<string, boolean | number | string> = {};
    for (const ci of checklistItems) {
      if (ci.type === "checkbox") initial[ci.id] = false;
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
              <a
                href={`tel:${item.ownerPhone}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {item.ownerPhone}
              </a>
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
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-1 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Compact item header */}
      <div className="flex items-center gap-3">
        {item.primaryPhotoUrl ? (
          <img
            src={item.primaryPhotoUrl}
            alt={item.name}
            className="w-14 h-14 rounded-full object-cover border-2"
            style={{ borderColor: item.tagType.color + "40" }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: item.tagType.color + "15" }}
          >
            <ClipboardCheck
              className="h-6 w-6"
              style={{ color: item.tagType.color + "50" }}
            />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">{item.name}</h1>
          <p className="text-sm text-muted-foreground">Complete the checklist below</p>
        </div>
      </div>

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
  );
}
