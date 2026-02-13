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
import { GenerateTagsDialog } from "@/components/admin/generate-tags-dialog";
import { Plus, RefreshCw } from "lucide-react";

interface TagData {
  id: string;
  activationCode: string;
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
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
    </div>
  );
}
