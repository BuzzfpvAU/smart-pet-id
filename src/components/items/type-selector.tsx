"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Dog,
  KeyRound,
  Luggage,
  CupSoda,
  Laptop,
  Bike,
  Wallet,
  Backpack,
  Camera,
  Dumbbell,
  Tag,
} from "lucide-react";
import type { ComponentType } from "react";

interface TagTypeOption {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  dog: Dog,
  "key-round": KeyRound,
  luggage: Luggage,
  "cup-soda": CupSoda,
  laptop: Laptop,
  bike: Bike,
  wallet: Wallet,
  backpack: Backpack,
  camera: Camera,
  dumbbell: Dumbbell,
  tag: Tag,
};

export function getTagTypeIcon(iconName: string): ComponentType<{ className?: string }> {
  return iconMap[iconName] || Tag;
}

export function TypeSelector({
  tagTypes,
  onSelect,
}: {
  tagTypes: TagTypeOption[];
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {tagTypes.map((type) => {
        const Icon = getTagTypeIcon(type.icon);
        return (
          <Card
            key={type.id}
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
            onClick={() => onSelect(type.slug)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: type.color + "20" }}
              >
                <div style={{ color: type.color }}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-semibold text-sm">{type.name}</h3>
              {type.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {type.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
