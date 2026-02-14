"use client";

import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FieldGroupDefinition } from "@/lib/tag-types";

interface FieldVisibilityTogglesProps {
  fieldGroups: FieldGroupDefinition[];
  visibility: Record<string, boolean>;
  defaultVisibility: Record<string, boolean>;
  onChange: (visibility: Record<string, boolean>) => void;
}

export function FieldVisibilityToggles({
  fieldGroups,
  visibility,
  defaultVisibility,
  onChange,
}: FieldVisibilityTogglesProps) {
  function toggle(key: string) {
    const current = visibility[key] ?? defaultVisibility[key] ?? true;
    onChange({ ...visibility, [key]: !current });
  }

  const allFields: { key: string; label: string; group: string }[] = [];

  for (const group of fieldGroups) {
    for (const field of group.fields) {
      allFields.push({ key: field.key, label: field.label, group: group.label });
    }
  }

  // Add common contact fields
  allFields.push(
    { key: "ownerPhone", label: "Phone Number", group: "Owner Contact" },
    { key: "ownerEmail", label: "Email Address", group: "Owner Contact" },
    { key: "ownerAddress", label: "Address", group: "Owner Contact" }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Page Visibility</CardTitle>
        <p className="text-sm text-muted-foreground">
          Control which information is visible when someone scans your tag
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {allFields.map((field) => {
          const isVisible = visibility[field.key] ?? defaultVisibility[field.key] ?? true;
          return (
            <div key={field.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{field.label}</p>
                <p className="text-xs text-muted-foreground">{field.group}</p>
              </div>
              <Switch checked={isVisible} onCheckedChange={() => toggle(field.key)} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
