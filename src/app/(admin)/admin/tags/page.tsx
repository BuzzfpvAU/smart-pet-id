"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { GenerateTagsDialog } from "@/components/admin/generate-tags-dialog";
import { Plus, RefreshCw, QrCode, ScanLine } from "lucide-react";

interface TagData {
  id: string;
  activationCode: string;
  shortCode: string | null;
  status: string;
  batchId: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
  pet: { name: string } | null;
  _count: { scans: number };
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrTag, setQrTag] = useState<TagData | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tags");
      const data = await res.json();
      setTags(data.tags || []);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  function statusBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "deactivated":
        return <Badge variant="destructive">Deactivated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tag Codes</h1>
          <p className="text-muted-foreground">
            Manage and generate activation codes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchTags}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowGenerate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Tags
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activation Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QR</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Pet</TableHead>
              <TableHead>Scans</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No tags found. Generate some!
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-mono text-sm">
                    {tag.activationCode}
                  </TableCell>
                  <TableCell>{statusBadge(tag.status)}</TableCell>
                  <TableCell>
                    {tag.shortCode ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQrTag(tag);
                          setQrDialogOpen(true);
                        }}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tag.user ? (
                      <span className="text-sm">{tag.user.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tag.pet ? (
                      <span className="text-sm">{tag.pet.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{tag._count.scans}</TableCell>
                  <TableCell>
                    {tag.batchId ? (
                      <span className="text-xs text-muted-foreground font-mono">
                        {tag.batchId.slice(0, 8)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(tag.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GenerateTagsDialog
        open={showGenerate}
        onOpenChange={setShowGenerate}
        onGenerated={fetchTags}
      />

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
                Scan this QR code to view the pet profile
              </p>
              <code className="text-xs text-muted-foreground">
                {qrTag.activationCode}
              </code>
              <code className="text-xs text-blue-600">
                {qrTag.shortCode
                  ? `${process.env.NEXT_PUBLIC_BASE_URL || ""}/s/${qrTag.shortCode}`
                  : `${process.env.NEXT_PUBLIC_BASE_URL || ""}/scan/${qrTag.id}`}
              </code>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
