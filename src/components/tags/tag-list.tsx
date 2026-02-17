"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { Link2, Unlink, XCircle, QrCode, ScanLine } from "lucide-react";
import { toast } from "sonner";

interface TagData {
  id: string;
  activationCode: string;
  shortCode: string | null;
  status: string;
  qrCodeUrl: string | null;
  pet: { id: string; name: string; species: string } | null;
  item: { id: string; name: string; tagType: { name: string } } | null;
  _count: { scans: number };
}

interface PetOption {
  id: string;
  name: string;
  species: string;
}

interface ItemOption {
  id: string;
  name: string;
  tagType: { name: string };
}

export function TagList({
  tags,
  pets,
  items = [],
}: {
  tags: TagData[];
  pets: PetOption[];
  items?: ItemOption[];
}) {
  const router = useRouter();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrTag, setQrTag] = useState<TagData | null>(null);

  async function linkTag() {
    if (!selectedTag || !selectedItem) return;

    const isPet = pets.some((p) => p.id === selectedItem);
    const body = isPet
      ? { petId: selectedItem }
      : { itemId: selectedItem };

    const res = await fetch(`/api/tags/${selectedTag}/link`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Tag linked");
      setLinkDialogOpen(false);
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to link tag");
    }
  }

  async function unlinkTag(tagId: string) {
    const res = await fetch(`/api/tags/${tagId}/unlink`, {
      method: "PUT",
    });

    if (res.ok) {
      toast.success("Tag unlinked");
      router.refresh();
    } else {
      toast.error("Failed to unlink tag");
    }
  }

  async function deactivateTag(tagId: string) {
    const res = await fetch(`/api/tags/${tagId}/deactivate`, {
      method: "PUT",
    });

    if (res.ok) {
      toast.success("Tag deactivated");
      router.refresh();
    } else {
      toast.error("Failed to deactivate tag");
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default" as const;
      case "inactive":
        return "secondary" as const;
      case "deactivated":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  function getLinkedName(tag: TagData) {
    if (tag.item) return `Linked to ${tag.item.name} (${tag.item.tagType.name})`;
    if (tag.pet) return `Linked to ${tag.pet.name} (${tag.pet.species})`;
    return "Not linked";
  }

  const linkOptions = [
    ...items.map((i) => ({
      id: i.id,
      label: `${i.name} (${i.tagType.name})`,
    })),
    ...pets.map((p) => ({
      id: p.id,
      label: `${p.name} (${p.species})`,
    })),
  ];

  return (
    <>
      <div className="space-y-4">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">
                      {tag.activationCode}
                    </code>
                    <Badge variant={statusVariant(tag.status)}>
                      {tag.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getLinkedName(tag)}
                    {" · "}
                    {tag._count.scans} scan{tag._count.scans !== 1 ? "s" : ""}
                  </p>
                </div>

                {tag.status === "active" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQrTag(tag);
                        setQrDialogOpen(true);
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      QR
                    </Button>
                    {tag.pet || tag.item ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unlinkTag(tag.id)}
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Unlink
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTag(tag.id);
                          setSelectedItem("");
                          setLinkDialogOpen(true);
                        }}
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        Link
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deactivateTag(tag.id)}
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Tag to Item</DialogTitle>
          </DialogHeader>
          {linkOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t created any items yet. Create an item first.
            </p>
          ) : (
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {linkOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={linkTag} disabled={!selectedItem}>
              Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              QR Code
            </DialogTitle>
          </DialogHeader>
          {qrTag && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeSVG
                value={
                  qrTag.shortCode
                    ? `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/s/${qrTag.shortCode}`
                    : `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/scan/${qrTag.id}`
                }
                size={220}
                level="M"
                includeMargin
              />
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to view the profile
              </p>
              <code className="text-xs text-muted-foreground">
                {qrTag.activationCode}
              </code>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
