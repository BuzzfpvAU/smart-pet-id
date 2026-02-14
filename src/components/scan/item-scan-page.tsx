"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  MapPin,
  Navigation,
  AlertTriangle,
  Heart,
  QrCode,
  Send,
  Check,
  Gift,
} from "lucide-react";
import type { FieldGroupDefinition } from "@/lib/tag-types";

interface ItemProfile {
  name: string;
  tagType: {
    slug: string;
    name: string;
    icon: string;
    color: string;
  };
  data: Record<string, unknown>;
  fieldGroups: FieldGroupDefinition[];
  photoUrls: string[];
  primaryPhotoUrl: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  ownerAddress: string | null;
  rewardOffered: boolean;
  rewardDetails: string | null;
  emergencyContacts?: { name: string; phone: string; relationship?: string }[] | null;
}

export function ItemScanPage({
  tagId,
  item,
}: {
  tagId: string;
  item: ItemProfile;
}) {
  const [scanId, setScanId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [finderPhone, setFinderPhone] = useState("");
  const [finderMessage, setFinderMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    fetch(`/api/scan/${tagId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: null, longitude: null }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.scanId) setScanId(data.scanId);
      })
      .catch(() => {});
  }, [tagId]);

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
        scanId,
      }),
    });

    setContactSent(true);
  }

  // Determine which field groups have visible data
  function hasGroupData(group: FieldGroupDefinition): boolean {
    return group.fields.some((f) => {
      const val = item.data[f.key];
      if (val === null || val === undefined || val === "") return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    });
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
        {/* Photo & Name */}
        <div className="text-center">
          {item.primaryPhotoUrl ? (
            <img
              src={item.primaryPhotoUrl}
              alt={item.name}
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 mb-4"
              style={{ borderColor: item.tagType.color + "40" }}
            />
          ) : (
            <div
              className="w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ backgroundColor: item.tagType.color + "15" }}
            >
              <QrCode className="h-12 w-12" style={{ color: item.tagType.color + "50" }} />
            </div>
          )}
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge
              style={{
                backgroundColor: item.tagType.color + "15",
                color: item.tagType.color,
              }}
            >
              {item.tagType.name}
            </Badge>
            {/* Show basic data as badges (species, breed, etc.) */}
            {item.fieldGroups[0]?.fields.slice(0, 3).map((field) => {
              const val = item.data[field.key];
              if (!val || typeof val !== "string") return null;
              return (
                <Badge key={field.key} variant="outline">
                  {val}
                </Badge>
              );
            })}
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

        {/* Dynamic Field Groups */}
        {item.fieldGroups.map((group) => {
          if (!hasGroupData(group)) return null;

          if (group.alertStyle) {
            return (
              <Card key={group.key} className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h2 className="font-semibold text-amber-800 dark:text-amber-200">
                      {group.label}
                    </h2>
                  </div>
                  <div className="space-y-2 text-sm">
                    {group.fields.map((field) => {
                      const val = item.data[field.key];
                      if (!val || (typeof val === "string" && !val.trim())) return null;
                      if (field.type === "contacts_list") return null;
                      return (
                        <p key={field.key}>
                          <strong>{field.label}:</strong> {String(val)}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={group.key}>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">{group.label}</h3>
                {group.fields.map((field) => {
                  const val = item.data[field.key];
                  if (!val) return null;

                  // Emergency contacts / contact lists
                  if (field.type === "contacts_list" && Array.isArray(val)) {
                    if (val.length === 0) return null;
                    return (
                      <div key={field.key} className="space-y-2">
                        <h4 className="font-medium text-xs text-muted-foreground">
                          {field.label}
                        </h4>
                        {(val as { name: string; phone: string; relationship?: string }[]).map(
                          (contact, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{contact.name}</p>
                                {contact.relationship && (
                                  <p className="text-xs text-muted-foreground">
                                    {contact.relationship}
                                  </p>
                                )}
                              </div>
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-sm text-primary hover:underline"
                              >
                                {contact.phone}
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    );
                  }

                  if (typeof val === "string" && !val.trim()) return null;

                  return (
                    <div key={field.key}>
                      <h4 className="font-medium text-xs text-muted-foreground">
                        {field.label}
                      </h4>
                      <p className="text-sm">{String(val)}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

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
              Found this item? Share your location
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
                  placeholder={`Optional message (e.g., where you found the ${item.tagType.name.toLowerCase()})`}
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
    </div>
  );
}
