"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { FieldGroupDefinition } from "@/lib/tag-types";

interface TagType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  fieldGroups: FieldGroupDefinition[];
  defaultVisibility: Record<string, boolean>;
  _count: { items: number };
}

export default function AdminTagTypesPage() {
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editType, setEditType] = useState<TagType | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("tag");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formFieldGroups, setFormFieldGroups] = useState("");

  const fetchTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tag-types");
      const data = await res.json();
      setTagTypes(data);
    } catch {
      toast.error("Failed to load tag types");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  function openCreate() {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormIcon("tag");
    setFormColor("#6366f1");
    setFormFieldGroups(
      JSON.stringify(
        [
          {
            key: "basic_info",
            label: "Basic Information",
            fields: [
              { key: "description", label: "Description", type: "textarea" },
            ],
          },
        ],
        null,
        2
      )
    );
    setEditType(null);
    setCreateOpen(true);
  }

  function openEdit(type: TagType) {
    setFormName(type.name);
    setFormSlug(type.slug);
    setFormDescription(type.description || "");
    setFormIcon(type.icon);
    setFormColor(type.color);
    setFormFieldGroups(JSON.stringify(type.fieldGroups, null, 2));
    setEditType(type);
    setCreateOpen(true);
  }

  async function handleSubmit() {
    let fieldGroups;
    try {
      fieldGroups = JSON.parse(formFieldGroups);
    } catch {
      toast.error("Invalid JSON in field groups");
      return;
    }

    const body = {
      name: formName,
      slug: formSlug,
      description: formDescription || null,
      icon: formIcon,
      color: formColor,
      fieldGroups,
      defaultVisibility: {},
    };

    try {
      const url = editType
        ? `/api/admin/tag-types/${editType.id}`
        : "/api/admin/tag-types";
      const method = editType ? "PUT" : "POST";

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

      toast.success(editType ? "Tag type updated" : "Tag type created");
      setCreateOpen(false);
      fetchTypes();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function toggleActive(type: TagType) {
    try {
      const res = await fetch(`/api/admin/tag-types/${type.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !type.isActive }),
      });

      if (res.ok) {
        toast.success(
          type.isActive ? "Tag type deactivated" : "Tag type activated"
        );
        fetchTypes();
      }
    } catch {
      toast.error("Failed to update");
    }
  }

  async function deleteType(type: TagType) {
    try {
      const res = await fetch(`/api/admin/tag-types/${type.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.deactivated) {
        toast.success("Tag type deactivated (has items, cannot delete)");
      } else if (data.success) {
        toast.success("Tag type deleted");
      } else {
        toast.error(data.error || "Failed to delete");
      }
      fetchTypes();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Tag Types</h1>
          <p className="text-muted-foreground text-sm">
            Manage tag types and their field configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTypes}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Type
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tagTypes.map((type) => {
                const fieldCount = (
                  type.fieldGroups as unknown as FieldGroupDefinition[]
                ).reduce((acc, g) => acc + g.fields.length, 0);

                return (
                  <TableRow key={type.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="font-medium">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{type.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{type._count.items}</TableCell>
                    <TableCell>{fieldCount} fields</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={type.isActive}
                          onCheckedChange={() => toggleActive(type)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteType(type)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editType ? `Edit ${editType.name}` : "New Tag Type"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editType) {
                      setFormSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                      );
                    }
                  }}
                  placeholder="e.g., Drone"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g., drone"
                  disabled={!!editType}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Short description of this tag type"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon (Lucide name)</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="e.g., laptop, key-round, dog"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Field Groups (JSON)</Label>
              <Textarea
                value={formFieldGroups}
                onChange={(e) => setFormFieldGroups(e.target.value)}
                rows={12}
                className="font-mono text-xs"
                placeholder="JSON array of field group definitions"
              />
              <p className="text-xs text-muted-foreground">
                Each group: {"{"} key, label, fields: [{"{"} key, label, type: &quot;text&quot;|&quot;textarea&quot;|&quot;select&quot;|&quot;number&quot;, required?, placeholder?, options? {"}"}] {"}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
