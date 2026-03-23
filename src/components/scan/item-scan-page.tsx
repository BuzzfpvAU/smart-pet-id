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
  const [scannerName, setScannerName] = useState("");
  const [scannerContact, setScannerContact] = useState("");
  const [description, setDescription] = useState("");

  const isEmergencyContact = item.tagType.slug === "emergency-contact";

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
            scanId,
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
  }, [tagId, scanId]);

  async function sendContact(e: React.FormEvent) {
    e.preventDefault();
    if (isEmergencyContact) {
      if (!description) return;
    } else {
      if (!finderPhone) return;
    }

    await fetch(`/api/scan/${tagId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: finderPhone || null,
        message: finderMessage,
        scanId,
        ...(isEmergencyContact && {
          description,
          scannerName: scannerName || null,
          scannerContact: scannerContact || null,
        }),
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
      {/* Header with gradient */}
      <div
        className="text-white p-4 text-center relative overflow-hidden"
        style={{ backgroundColor: item.tagType.color }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        <div className="relative flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          <span className="font-display font-semibold">Tagz.au</span>
        </div>
      </div>

      {/* Gradient fade from tag color */}
      <div
        className="h-32 -mb-24"
        style={{
          background: `linear-gradient(to bottom, ${item.tagType.color}15, transparent)`,
        }}
      />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Photo & Name */}
        <div className="text-center">
          {item.primaryPhotoUrl ? (
            <img
              src={item.primaryPhotoUrl}
              alt={item.name}
              className="w-36 h-36 rounded-full mx-auto object-cover shadow-xl ring-4 ring-background mb-4"
            />
          ) : (
            <div
              className="w-36 h-36 rounded-full mx-auto flex items-center justify-center shadow-xl ring-4 ring-background mb-4"
              style={{ backgroundColor: item.tagType.color + "15" }}
            >
              <QrCode className="h-14 w-14" style={{ color: item.tagType.color + "50" }} />
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-bold">{item.name}</h1>
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

        {/* Reward Offer - hidden for emergency contact cards */}
        {item.rewardOffered && item.rewardDetails && item.tagType.slug !== "emergency-contact" && (
          <Card className="border-green-300 bg-green-50 dark:bg-green-950/20 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-green-600" />
                <h2 className="font-display font-semibold text-green-800 dark:text-green-200">
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
              <Card key={group.key} className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h2 className="font-display font-semibold text-amber-800 dark:text-amber-200">
                      {group.label}
                    </h2>
                  </div>
                  <div className="space-y-2 text-sm">
                    {group.fields.map((field) => {
                      const val = item.data[field.key];
                      if (!val || (typeof val === "string" && !val.trim())) return null;
                      if (field.type === "contacts_list" || field.type === "emergency_contacts_list") return null;
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
            <Card key={group.key} className="rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-display font-semibold text-sm">{group.label}</h3>
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
                                className="text-sm text-accent hover:underline"
                              >
                                {contact.phone}
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    );
                  }

                  // Emergency contacts list (with email)
                  if (field.type === "emergency_contacts_list" && Array.isArray(val)) {
                    if (val.length === 0) return null;
                    return (
                      <div key={field.key} className="space-y-2">
                        <h4 className="font-medium text-xs text-muted-foreground">
                          {field.label}
                        </h4>
                        {(val as { name: string; phone: string; email: string }[]).map(
                          (contact, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{contact.name}</p>
                                {contact.email && (
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="text-xs text-muted-foreground hover:underline"
                                  >
                                    {contact.email}
                                  </a>
                                )}
                              </div>
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-sm text-accent hover:underline"
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
              className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-6 text-lg font-semibold shadow-lg active:scale-[0.97] transition-all duration-200"
            >
              <Phone className="h-6 w-6" />
              Call Owner
            </a>

            <Card className="rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-display font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-accent" />
                  Owner Contact
                </h2>
                {item.ownerPhone && (
                  <a
                    href={`tel:${item.ownerPhone}`}
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {item.ownerPhone}
                  </a>
                )}
                {item.ownerEmail && (
                  <a
                    href={`mailto:${item.ownerEmail}`}
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
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
          <Card className="rounded-2xl">
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
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
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
        {isEmergencyContact ? (
          <Card className="border-red-300 rounded-2xl">
            <CardContent className="p-4">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Why did you scan this tag?
              </h3>
              {contactSent ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <p className="text-sm">
                    Thank you. All emergency contacts have been notified with your details.
                  </p>
                </div>
              ) : (
                <form onSubmit={sendContact} className="space-y-3">
                  <Textarea
                    placeholder="Please describe why you scanned this tag and the situation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    required
                  />
                  <Input
                    placeholder="Your name (optional)"
                    value={scannerName}
                    onChange={(e) => setScannerName(e.target.value)}
                  />
                  <Input
                    placeholder="Your phone or email (optional)"
                    value={scannerContact}
                    onChange={(e) => setScannerContact(e.target.value)}
                  />
                  <Button type="submit" className="w-full" variant="destructive">
                    <Send className="h-4 w-4 mr-2" />
                    Notify Emergency Contacts
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="backdrop-blur-xl bg-card/80 border-border/30 rounded-2xl">
            <CardContent className="p-4">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
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
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground py-4">
          Powered by <span className="font-display font-semibold">Tagz.au</span>
        </p>
      </div>
    </div>
  );
}
