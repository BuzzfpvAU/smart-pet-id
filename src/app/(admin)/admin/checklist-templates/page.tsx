"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface ChecklistItemDef {
  id: string;
  label: string;
  type: "checkbox" | "number" | "text";
  required: boolean;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  items: ChecklistItemDef[];
  isActive: boolean;
  sortOrder: number;
}

function generateId() {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function AdminChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ChecklistTemplate | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("clipboard-check");
  const [formColor, setFormColor] = useState("#0ea5e9");
  const [formItems, setFormItems] = useState<ChecklistItemDef[]>([]);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/checklist-templates");
      const data = await res.json();
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openCreate() {
    setFormName("");
    setFormDescription("");
    setFormIcon("clipboard-check");
    setFormColor("#0ea5e9");
    setFormItems([]);
    setEditTemplate(null);
    setDialogOpen(true);
  }

  function openEdit(template: ChecklistTemplate) {
    setFormName(template.name);
    setFormDescription(template.description || "");
    setFormIcon(template.icon);
    setFormColor(template.color);
    setFormItems(
      (template.items as ChecklistItemDef[]).map((item) => ({ ...item }))
    );
    setEditTemplate(template);
    setDialogOpen(true);
  }

  function addItem() {
    setFormItems((prev) => [
      ...prev,
      { id: generateId(), label: "", type: "checkbox", required: false },
    ]);
  }

  function updateItem(index: number, updates: Partial<ChecklistItemDef>) {
    setFormItems((prev) => {
      const items = [...prev];
      items[index] = { ...items[index], ...updates };
      return items;
    });
  }

  function removeItem(index: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= formItems.length) return;
    setFormItems((prev) => {
      const items = [...prev];
      [items[index], items[target]] = [items[target], items[index]];
      return items;
    });
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (formItems.length === 0) {
      toast.error("Add at least one checklist item");
      return;
    }

    const emptyLabels = formItems.some((item) => !item.label.trim());
    if (emptyLabels) {
      toast.error("All items must have a label");
      return;
    }

    const body = {
      name: formName,
      description: formDescription || null,
      icon: formIcon,
      color: formColor,
      items: formItems,
    };

    try {
      const url = editTemplate
        ? `/api/admin/checklist-templates/${editTemplate.id}`
        : "/api/admin/checklist-templates";
      const method = editTemplate ? "PUT" : "POST";

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

      toast.success(editTemplate ? "Template updated" : "Template created");
      setDialogOpen(false);
      fetchTemplates();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function toggleActive(template: ChecklistTemplate) {
    try {
      const res = await fetch(`/api/admin/checklist-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      if (res.ok) {
        toast.success(
          template.isActive ? "Template deactivated" : "Template activated"
        );
        fetchTemplates();
      }
    } catch {
      toast.error("Failed to update");
    }
  }

  async function deleteTemplate(template: ChecklistTemplate) {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/checklist-templates/${template.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Template deleted");
        fetchTemplates();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Checklist Templates</h1>
          <p className="text-muted-foreground text-sm">
            Manage reusable checklist templates for users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTemplates}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No templates yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: template.color }}
                        />
                        <div>
                          <span className="font-medium">{template.name}</span>
                          {template.description && (
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(template.items as ChecklistItemDef[]).length} items
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={template.isActive}
                          onCheckedChange={() => toggleActive(template)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTemplate(template)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTemplate ? `Edit ${editTemplate.name}` : "New Checklist Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Drone Pre-flight"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon (Lucide name)</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="e.g., clipboard-check, plane, car"
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
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>
            </div>

            {/* Checklist Items Builder */}
            <div className="space-y-3">
              <Label>Checklist Items *</Label>

              {formItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items yet. Add items below.
                </p>
              )}

              {formItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-2 items-center border rounded-lg p-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => moveItem(index, "up")}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === formItems.length - 1}
                      onClick={() => moveItem(index, "down")}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Item label"
                    value={item.label}
                    onChange={(e) => updateItem(index, { label: e.target.value })}
                    className="flex-1"
                  />
                  <Select
                    value={item.type}
                    onValueChange={(v) =>
                      updateItem(index, { type: v as "checkbox" | "number" | "text" })
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={item.required}
                      onCheckedChange={(v) => updateItem(index, { required: v })}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Req
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
