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
import { FieldVisibilityToggles } from "./field-visibility-toggles";
import type { FieldGroupDefinition, FieldDefinition } from "@/lib/tag-types";

interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

interface TagTypeInfo {
  slug: string;
  name: string;
  icon: string;
  color: string;
  fieldGroups: FieldGroupDefinition[];
  defaultVisibility: Record<string, boolean>;
}

interface ItemFormData {
  name: string;
  data: Record<string, unknown>;
  photoUrls: string[];
  primaryPhotoUrl: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress: string;
  rewardOffered: boolean;
  rewardDetails: string;
  visibility: Record<string, boolean>;
}

interface ItemFormProps {
  tagType: TagTypeInfo;
  initialData?: Partial<ItemFormData>;
  itemId?: string;
}

export function ItemForm({ tagType, initialData, itemId }: ItemFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ItemFormData>({
    name: initialData?.name || "",
    data: (initialData?.data as Record<string, unknown>) || {},
    photoUrls: initialData?.photoUrls || [],
    primaryPhotoUrl: initialData?.primaryPhotoUrl || "",
    ownerPhone: initialData?.ownerPhone || "",
    ownerEmail: initialData?.ownerEmail || "",
    ownerAddress: initialData?.ownerAddress || "",
    rewardOffered: initialData?.rewardOffered || false,
    rewardDetails: initialData?.rewardDetails || "",
    visibility: initialData?.visibility || tagType.defaultVisibility || {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function updateField(key: string, value: unknown) {
    setData((prev) => ({ ...prev, data: { ...prev.data, [key]: value } }));
  }

  function updateTop(field: keyof ItemFormData, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  // Emergency contacts helpers (for contacts_list field type)
  function getContacts(key: string): EmergencyContact[] {
    return (data.data[key] as EmergencyContact[]) || [];
  }

  function addContact(key: string) {
    const contacts = getContacts(key);
    updateField(key, [...contacts, { name: "", phone: "", relationship: "" }]);
  }

  function updateContact(
    key: string,
    index: number,
    field: keyof EmergencyContact,
    value: string
  ) {
    const contacts = [...getContacts(key)];
    contacts[index] = { ...contacts[index], [field]: value };
    updateField(key, contacts);
  }

  function removeContact(key: string, index: number) {
    const contacts = getContacts(key).filter((_, i) => i !== index);
    updateField(key, contacts);
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
      const url = itemId ? `/api/items/${itemId}` : "/api/items";
      const method = itemId ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: data.name,
        data: data.data,
        photoUrls: data.photoUrls,
        primaryPhotoUrl: data.primaryPhotoUrl || null,
        ownerPhone: data.ownerPhone || null,
        ownerEmail: data.ownerEmail || null,
        ownerAddress: data.ownerAddress || null,
        rewardOffered: data.rewardOffered,
        rewardDetails: data.rewardDetails || null,
        visibility: data.visibility,
      };

      if (!itemId) {
        body.tagTypeSlug = tagType.slug;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
        return;
      }

      const item = await res.json();
      toast.success(itemId ? "Item updated" : "Item created");
      router.push(`/dashboard/items/${item.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function renderField(field: FieldDefinition) {
    const value = data.data[field.key];

    if (field.type === "contacts_list") {
      const contacts = getContacts(field.key);
      return (
        <div key={field.key} className="space-y-3">
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No contacts added yet.
            </p>
          )}
          {contacts.map((contact, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) =>
                    updateContact(field.key, i, "name", e.target.value)
                  }
                />
                <Input
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(e) =>
                    updateContact(field.key, i, "phone", e.target.value)
                  }
                />
                <Input
                  placeholder="Relationship"
                  value={contact.relationship || ""}
                  onChange={(e) =>
                    updateContact(field.key, i, "relationship", e.target.value)
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeContact(field.key, i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addContact(field.key)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Contact
          </Button>
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.key} className="space-y-2">
          <Label>{field.label}{field.required && " *"}</Label>
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => updateField(field.key, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.key} className="space-y-2">
          <Label>{field.label}{field.required && " *"}</Label>
          <Textarea
            placeholder={field.placeholder}
            value={(value as string) || ""}
            onChange={(e) => updateField(field.key, e.target.value)}
            required={field.required}
          />
        </div>
      );
    }

    if (field.type === "toggle") {
      return (
        <div key={field.key} className="flex items-center justify-between">
          <Label>{field.label}</Label>
          <Switch
            checked={!!value}
            onCheckedChange={(v) => updateField(field.key, v)}
          />
        </div>
      );
    }

    // text, number, email, tel
    return (
      <div key={field.key} className="space-y-2">
        <Label>{field.label}{field.required && " *"}</Label>
        <Input
          type={field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
          placeholder={field.placeholder}
          value={(value as string) || ""}
          onChange={(e) => updateField(field.key, e.target.value)}
          required={field.required}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
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
                      alt="Item photo"
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
                JPEG, PNG, or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Name */}
      <Card>
        <CardHeader>
          <CardTitle>Name</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="name">
              {tagType.slug === "pet" ? "Pet Name" : "Item Name"} *
            </Label>
            <Input
              id="name"
              placeholder={
                tagType.slug === "pet"
                  ? "e.g., Buddy"
                  : tagType.slug === "keys"
                  ? "e.g., House Keys"
                  : `Name your ${tagType.name.toLowerCase()}`
              }
              value={data.name}
              onChange={(e) => updateTop("name", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Field Groups */}
      {tagType.fieldGroups.map((group) => (
        <Card key={group.key}>
          <CardHeader>
            <CardTitle>{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.fields.map((field) => renderField(field))}
          </CardContent>
        </Card>
      ))}

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
                onChange={(e) => updateTop("ownerPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={data.ownerEmail}
                onChange={(e) => updateTop("ownerEmail", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerAddress">Address</Label>
            <Input
              id="ownerAddress"
              value={data.ownerAddress}
              onChange={(e) => updateTop("ownerAddress", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reward Offer */}
      <Card>
        <CardHeader>
          <CardTitle>Reward Offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Offer a reward</p>
              <p className="text-xs text-muted-foreground">
                Let finders know a reward is offered for return
              </p>
            </div>
            <Switch
              checked={data.rewardOffered}
              onCheckedChange={(v) => updateTop("rewardOffered", v)}
            />
          </div>
          {data.rewardOffered && (
            <div className="space-y-2">
              <Label htmlFor="rewardDetails">Reward Details</Label>
              <Textarea
                id="rewardDetails"
                placeholder="e.g., $50 reward for safe return"
                value={data.rewardDetails}
                onChange={(e) => updateTop("rewardDetails", e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visibility Toggles */}
      <FieldVisibilityToggles
        fieldGroups={tagType.fieldGroups}
        visibility={data.visibility}
        defaultVisibility={tagType.defaultVisibility}
        onChange={(v) => updateTop("visibility", v)}
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : itemId
            ? "Update"
            : "Create"}
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
