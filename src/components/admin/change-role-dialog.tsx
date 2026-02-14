"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Shield, ShieldOff } from "lucide-react";

interface ChangeRoleDialogProps {
  user: { id: string; name: string; email: string; role: string } | null;
  onClose: () => void;
  onChanged: () => void;
}

export function ChangeRoleDialog({
  user,
  onClose,
  onChanged,
}: ChangeRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const newRole = user?.role === "admin" ? "user" : "admin";
  const isPromoting = newRole === "admin";

  async function handleChangeRole() {
    if (!user) return;

    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change role");
        return;
      }

      onChanged();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={!!user} onOpenChange={() => onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isPromoting ? (
              <Shield className="h-5 w-5 text-blue-600" />
            ) : (
              <ShieldOff className="h-5 w-5 text-orange-600" />
            )}
            {isPromoting ? "Promote to Admin" : "Remove Admin Access"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPromoting ? (
              <>
                Are you sure you want to make <strong>{user?.name}</strong> ({user?.email}) an admin?
                They will have full access to the admin console, including managing users, tags, and pets.
              </>
            ) : (
              <>
                Are you sure you want to remove admin access from <strong>{user?.name}</strong> ({user?.email})?
                They will no longer be able to access the admin console.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant={isPromoting ? "default" : "destructive"}
            onClick={handleChangeRole}
            disabled={isLoading}
          >
            {isLoading
              ? "Updating..."
              : isPromoting
                ? "Make Admin"
                : "Remove Admin"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
