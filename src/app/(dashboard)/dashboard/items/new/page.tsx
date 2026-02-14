"use client";

import { useState, useEffect } from "react";
import { TypeSelector } from "@/components/items/type-selector";
import { ItemForm } from "@/components/items/item-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { FieldGroupDefinition } from "@/lib/tag-types";

interface TagType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  fieldGroups: FieldGroupDefinition[];
  defaultVisibility: Record<string, boolean>;
}

export default function NewItemPage() {
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const [selectedType, setSelectedType] = useState<TagType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tag-types")
      .then((res) => res.json())
      .then((data) => {
        setTagTypes(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!selectedType) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Add New Item</h1>
          <p className="text-muted-foreground text-sm">
            Choose a tag type to get started
          </p>
        </div>
        <TypeSelector
          tagTypes={tagTypes}
          onSelect={(slug) => {
            const type = tagTypes.find((t) => t.slug === slug);
            if (type) setSelectedType(type);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => setSelectedType(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Change Type
        </Button>
        <h1 className="text-2xl font-bold">New {selectedType.name}</h1>
        <p className="text-muted-foreground text-sm">
          Fill in the details for your {selectedType.name.toLowerCase()}
        </p>
      </div>
      <ItemForm
        tagType={{
          slug: selectedType.slug,
          name: selectedType.name,
          icon: selectedType.icon,
          color: selectedType.color,
          fieldGroups: selectedType.fieldGroups as unknown as FieldGroupDefinition[],
          defaultVisibility: selectedType.defaultVisibility as Record<string, boolean>,
        }}
      />
    </div>
  );
}
