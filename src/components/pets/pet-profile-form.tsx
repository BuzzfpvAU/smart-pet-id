"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

interface PetFormData {
  id?: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  primaryPhotoUrl: string;
  photoUrls: string[];
  medications: string;
  vaccinations: string;
  allergies: string;
  specialNeeds: string;
  foodIntolerances: string;
  behavioralNotes: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress: string;
  emergencyContacts: EmergencyContact[];
  privacyEnabled: boolean;
}

const defaultData: PetFormData = {
  name: "",
  species: "",
  breed: "",
  age: "",
  primaryPhotoUrl: "",
  photoUrls: [],
  medications: "",
  vaccinations: "",
  allergies: "",
  specialNeeds: "",
  foodIntolerances: "",
  behavioralNotes: "",
  ownerPhone: "",
  ownerEmail: "",
  ownerAddress: "",
  emergencyContacts: [],
  privacyEnabled: false,
};

interface PetProfileFormProps {
  initialData?: Partial<PetFormData>;
  petId?: string;
}

export function PetProfileForm({ initialData, petId }: PetProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<PetFormData>({
    ...defaultData,
    ...initialData,
    primaryPhotoUrl: initialData?.primaryPhotoUrl || "",
    photoUrls: initialData?.photoUrls || [],
    emergencyContacts: initialData?.emergencyContacts || [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function update(field: keyof PetFormData, value: string | boolean) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function addEmergencyContact() {
    setData((prev) => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts,
        { name: "", phone: "", relationship: "" },
      ],
    }));
  }

  function updateContact(
    index: number,
    field: keyof EmergencyContact,
    value: string
  ) {
    setData((prev) => {
      const contacts = [...prev.emergencyContacts];
      contacts[index] = { ...contacts[index], [field]: value };
      return { ...prev, emergencyContacts: contacts };
    });
  }

  function removeContact(index: number) {
    setData((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index),
    }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Upload failed");
        return;
      }

      const { url } = await res.json();
      setData((prev) => ({
        ...prev,
        primaryPhotoUrl: prev.primaryPhotoUrl || url,
        photoUrls: [...prev.photoUrls, url],
      }));
      toast.success("Photo uploaded");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removePhoto(url: string) {
    setData((prev) => {
      const newPhotoUrls = prev.photoUrls.filter((u) => u !== url);
      return {
        ...prev,
        photoUrls: newPhotoUrls,
        primaryPhotoUrl:
          prev.primaryPhotoUrl === url
            ? newPhotoUrls[0] || ""
            : prev.primaryPhotoUrl,
      };
    });
  }

  function setPrimaryPhoto(url: string) {
    setData((prev) => ({ ...prev, primaryPhotoUrl: url }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = petId ? `/api/pets/${petId}` : "/api/pets";
      const method = petId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save pet profile");
        return;
      }

      const pet = await res.json();
      toast.success(petId ? "Pet profile updated" : "Pet profile created");
      router.push(`/dashboard/pets/${pet.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Pet Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Pet Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.photoUrls.map((url) => (
                  <div
                    key={url}
                    className={`relative group rounded-lg overflow-hidden border-2 ${
                      data.primaryPhotoUrl === url
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={url}
                      alt="Pet photo"
                      className="w-full h-32 object-cover cursor-pointer"
                      onClick={() => setPrimaryPhoto(url)}
                    />
                    {data.primaryPhotoUrl === url && (
                      <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No photos yet</p>
                </div>
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Photo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPEG, PNG, or WebP. Max 5MB. Click a photo to set it as primary.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <Select
                value={data.species}
                onValueChange={(v) => update("species", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={data.breed}
                onChange={(e) => update("breed", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                placeholder="e.g., 3 years"
                value={data.age}
                onChange={(e) => update("age", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Info */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medications">Medications</Label>
            <Textarea
              id="medications"
              placeholder="List any current medications..."
              value={data.medications}
              onChange={(e) => update("medications", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vaccinations">Vaccinations</Label>
            <Textarea
              id="vaccinations"
              placeholder="Vaccination history..."
              value={data.vaccinations}
              onChange={(e) => update("vaccinations", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                value={data.allergies}
                onChange={(e) => update("allergies", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foodIntolerances">Food Intolerances</Label>
              <Input
                id="foodIntolerances"
                value={data.foodIntolerances}
                onChange={(e) => update("foodIntolerances", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialNeeds">Special Needs</Label>
            <Input
              id="specialNeeds"
              value={data.specialNeeds}
              onChange={(e) => update("specialNeeds", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Behavioral Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any behavioral notes that might help someone caring for your pet..."
            value={data.behavioralNotes}
            onChange={(e) => update("behavioralNotes", e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Owner Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Phone</Label>
              <Input
                id="ownerPhone"
                type="tel"
                value={data.ownerPhone}
                onChange={(e) => update("ownerPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={data.ownerEmail}
                onChange={(e) => update("ownerEmail", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerAddress">Address</Label>
            <Input
              id="ownerAddress"
              value={data.ownerAddress}
              onChange={(e) => update("ownerAddress", e.target.value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Privacy Mode</p>
              <p className="text-xs text-muted-foreground">
                When enabled, your contact info is hidden from the public scan
                page. Enable when your pet is safe at home.
              </p>
            </div>
            <Switch
              checked={data.privacyEnabled}
              onCheckedChange={(v) => update("privacyEnabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Emergency Contacts</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmergencyContact}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.emergencyContacts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No emergency contacts added yet.
            </p>
          )}
          {data.emergencyContacts.map((contact, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => updateContact(i, "name", e.target.value)}
                />
                <Input
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(e) => updateContact(i, "phone", e.target.value)}
                />
                <Input
                  placeholder="Relationship"
                  value={contact.relationship || ""}
                  onChange={(e) =>
                    updateContact(i, "relationship", e.target.value)
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeContact(i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : petId
              ? "Update Pet Profile"
              : "Create Pet Profile"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
