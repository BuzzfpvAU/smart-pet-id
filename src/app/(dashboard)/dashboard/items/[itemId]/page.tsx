"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ItemForm } from "@/components/items/item-form";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { FieldGroupDefinition } from "@/lib/tag-types";

interface ItemData {
  id: string;
  name: string;
  data: Record<string, unknown>;
  photoUrls: string[];
  primaryPhotoUrl: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  ownerAddress: string | null;
  rewardOffered: boolean;
  rewardDetails: string | null;
  visibility: Record<string, boolean>;
  tagType: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    color: string;
    fieldGroups: FieldGroupDefinition[];
    defaultVisibility: Record<string, boolean>;
  };
}

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<ItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${params.itemId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setItem)
      .catch(() => {
        toast.error("Item not found");
        router.push("/dashboard");
      })
      .finally(() => setIsLoading(false));
  }, [params.itemId, router]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/items/${params.itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Item deleted");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Edit {item.name}</h1>
          <p className="text-muted-foreground text-sm">
            {item.tagType.name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <ItemForm
        tagType={{
          slug: item.tagType.slug,
          name: item.tagType.name,
          icon: item.tagType.icon,
          color: item.tagType.color,
          fieldGroups: item.tagType.fieldGroups as unknown as FieldGroupDefinition[],
          defaultVisibility: item.tagType.defaultVisibility as Record<string, boolean>,
        }}
        itemId={item.id}
        initialData={{
          name: item.name,
          data: item.data as Record<string, unknown>,
          photoUrls: item.photoUrls,
          primaryPhotoUrl: item.primaryPhotoUrl || "",
          ownerPhone: item.ownerPhone || "",
          ownerEmail: item.ownerEmail || "",
          ownerAddress: item.ownerAddress || "",
          rewardOffered: item.rewardOffered,
          rewardDetails: item.rewardDetails || "",
          visibility: item.visibility as Record<string, boolean>,
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {item.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this item and unlink all associated
            tags. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
