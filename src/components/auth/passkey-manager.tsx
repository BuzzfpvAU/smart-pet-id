"use client";

import { useState, useEffect, useCallback } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Fingerprint, Plus, Trash2, ShieldCheck, Smartphone } from "lucide-react";

interface PasskeyInfo {
  id: string;
  deviceName: string;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  createdAt: string;
}

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPasskeys = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/passkey");
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data.passkeys);
      }
    } catch {
      toast.error("Failed to load passkeys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  async function handleRegister() {
    setIsRegistering(true);

    try {
      // Step 1: Get registration options from server
      const optionsRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });

      if (!optionsRes.ok) {
        throw new Error("Failed to get registration options");
      }

      const options = await optionsRes.json();

      // Step 2: Start WebAuthn registration in the browser
      const registration = await startRegistration(options);

      // Step 3: Send the response to the server for verification
      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: registration,
          deviceName: deviceName || "Passkey",
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Verification failed");
      }

      toast.success("Passkey registered successfully!");
      setShowAddDialog(false);
      setDeviceName("");
      fetchPasskeys();
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err.name === "NotAllowedError") {
        toast.error("Registration was cancelled");
      } else {
        toast.error(err.message || "Failed to register passkey");
      }
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleDelete(passkeyId: string) {
    setIsDeleting(true);

    try {
      const res = await fetch("/api/auth/passkey", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkeyId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete passkey");
      }

      toast.success("Passkey removed");
      setDeleteId(null);
      fetchPasskeys();
    } catch {
      toast.error("Failed to remove passkey");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Passkeys
              </CardTitle>
              <CardDescription className="mt-1">
                Sign in securely with fingerprint, face recognition, or your device&apos;s screen lock.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Loading passkeys...
            </div>
          ) : passkeys.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
              <Fingerprint className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No passkeys registered yet.</p>
              <p className="text-xs mt-1">
                Add a passkey for faster, more secure sign-in.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      {pk.credentialDeviceType === "multiDevice" ? (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pk.deviceName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          Added {new Date(pk.createdAt).toLocaleDateString()}
                        </span>
                        {pk.credentialBackedUp && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            Synced
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(pk.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Passkey Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Passkey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Your device will ask you to verify your identity using fingerprint, face recognition, or screen lock.
            </p>
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name (optional)</Label>
              <Input
                id="deviceName"
                placeholder="e.g. iPhone, MacBook, Windows PC"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Give this passkey a name so you can identify it later.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setDeviceName("");
              }}
              disabled={isRegistering}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegister}
              disabled={isRegistering}
              className="gap-2"
            >
              <Fingerprint className="h-4 w-4" />
              {isRegistering ? "Registering..." : "Register Passkey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Passkey</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this passkey? You won&apos;t be able to
            use it to sign in anymore.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
