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
} from "lucide-react";

interface PetProfile {
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  photoUrls: string[];
  primaryPhotoUrl: string | null;
  medications: string | null;
  vaccinations: string | null;
  allergies: string | null;
  specialNeeds: string | null;
  foodIntolerances: string | null;
  behavioralNotes: string | null;
  privacyEnabled: boolean;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  ownerAddress?: string | null;
  emergencyContacts?: { name: string; phone: string; relationship?: string }[] | null;
}

export function ScanPageClient({
  tagId,
  pet,
}: {
  tagId: string;
  pet: PetProfile;
}) {
  const [scanId, setScanId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [finderPhone, setFinderPhone] = useState("");
  const [finderMessage, setFinderMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  // Log the scan on page load
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
        // Update the scan with GPS coordinates
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

  const hasMedicalAlert =
    pet.allergies || pet.medications || pet.foodIntolerances || pet.specialNeeds;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          <span className="font-semibold">Tagz.au</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Pet Photo & Name */}
        <div className="text-center">
          {pet.primaryPhotoUrl ? (
            <img
              src={pet.primaryPhotoUrl}
              alt={pet.name}
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary/20 mb-4"
            />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto bg-muted flex items-center justify-center mb-4">
              <QrCode className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <h1 className="text-3xl font-bold">{pet.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="secondary">{pet.species}</Badge>
            {pet.breed && <Badge variant="outline">{pet.breed}</Badge>}
            {pet.age && <Badge variant="outline">{pet.age}</Badge>}
          </div>
        </div>

        {/* Medical Alert */}
        {hasMedicalAlert && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="font-semibold text-amber-800 dark:text-amber-200">
                  Medical Information
                </h2>
              </div>
              <div className="space-y-2 text-sm">
                {pet.allergies && (
                  <p>
                    <strong>Allergies:</strong> {pet.allergies}
                  </p>
                )}
                {pet.medications && (
                  <p>
                    <strong>Medications:</strong> {pet.medications}
                  </p>
                )}
                {pet.foodIntolerances && (
                  <p>
                    <strong>Food intolerances:</strong> {pet.foodIntolerances}
                  </p>
                )}
                {pet.specialNeeds && (
                  <p>
                    <strong>Special needs:</strong> {pet.specialNeeds}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vaccination & Behavioral Notes */}
        {(pet.vaccinations || pet.behavioralNotes) && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {pet.vaccinations && (
                <div>
                  <h3 className="font-medium text-sm mb-1">Vaccinations</h3>
                  <p className="text-sm text-muted-foreground">
                    {pet.vaccinations}
                  </p>
                </div>
              )}
              {pet.behavioralNotes && (
                <div>
                  <h3 className="font-medium text-sm mb-1">
                    Behavioral Notes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {pet.behavioralNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Owner Contact */}
        {!pet.privacyEnabled && pet.ownerPhone && (
          <>
            <a
              href={`tel:${pet.ownerPhone}`}
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
                {pet.ownerPhone && (
                  <a
                    href={`tel:${pet.ownerPhone}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {pet.ownerPhone}
                  </a>
                )}
                {pet.ownerEmail && (
                  <a
                    href={`mailto:${pet.ownerEmail}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {pet.ownerEmail}
                  </a>
                )}
                {pet.ownerAddress && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {pet.ownerAddress}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            {pet.emergencyContacts && pet.emergencyContacts.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">
                    Emergency Contacts
                  </h3>
                  <div className="space-y-2">
                    {pet.emergencyContacts.map((contact, i) => (
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {pet.privacyEnabled && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                The owner&apos;s contact information is currently set to private.
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
              Share Your Location
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
                  placeholder="Optional message (e.g., where you found this)"
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
