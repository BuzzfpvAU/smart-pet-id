"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ClipboardCheck,
} from "lucide-react";

export interface ChecklistItem {
  id: string;
  label: string;
  type: "checkbox" | "number" | "text";
  required: boolean;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  items: ChecklistItem[];
}

interface ChecklistBuilderProps {
  value: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

function generateId() {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ChecklistBuilder({ value, onChange }: ChecklistBuilderProps) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    fetch("/api/checklist-templates")
      .then((res) => (res.ok ? res.json() : []))
      .then(setTemplates)
      .catch(() => {});
  }, []);

  function applyTemplate(templateId: string) {
    if (templateId === "none") {
      setSelectedTemplate("");
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    if (value.length > 0) {
      const confirmed = window.confirm(
        "This will replace your current checklist items. Continue?"
      );
      if (!confirmed) {
        setSelectedTemplate("");
        return;
      }
    }

    // Clone template items with fresh IDs
    const items = template.items.map((item) => ({
      ...item,
      id: generateId(),
    }));
    onChange(items);
    setSelectedTemplate(templateId);
  }

  function addItem() {
    onChange([
      ...value,
      { id: generateId(), label: "", type: "checkbox", required: false },
    ]);
  }

  function updateItem(index: number, updates: Partial<ChecklistItem>) {
    const items = [...value];
    items[index] = { ...items[index], ...updates };
    onChange(items);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= value.length) return;
    const items = [...value];
    [items[index], items[target]] = [items[target], items[index]];
    onChange(items);
  }

  return (
    <div className="space-y-4">
      {/* Template selector */}
      {templates.length > 0 && (
        <div className="space-y-2">
          <Label>Start from a template (optional)</Label>
          <Select value={selectedTemplate} onValueChange={applyTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No template</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {t.description ? ` — ${t.description}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Checklist items */}
      {value.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-center">
          <div className="text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No checklist items yet</p>
            <p className="text-xs">
              Add items below or select a template above
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex gap-2 items-start">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 pt-1">
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
                      disabled={index === value.length - 1}
                      onClick={() => moveItem(index, "down")}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Item fields */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <Input
                      placeholder="Item label"
                      value={item.label}
                      onChange={(e) =>
                        updateItem(index, { label: e.target.value })
                      }
                    />
                    <Select
                      value={item.type}
                      onValueChange={(v) =>
                        updateItem(index, {
                          type: v as "checkbox" | "number" | "text",
                        })
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
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.required}
                        onCheckedChange={(v) =>
                          updateItem(index, { required: v })
                        }
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Required
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" />
        Add Checklist Item
      </Button>
    </div>
  );
}
