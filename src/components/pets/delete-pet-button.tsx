"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeletePetButton({
  petId,
  petName,
}: {
  petId: string;
  petName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Profile deleted");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Failed to delete profile");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="max-w-3xl mt-8 pt-8 border-t">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-destructive">Danger Zone</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete this profile and all associated data.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Profile
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {petName}?</DialogTitle>
            <DialogDescription>
              This will permanently delete {petName}&apos;s profile, including
              all photos, medical info, and scan history. Any linked tags will be
              unlinked. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
