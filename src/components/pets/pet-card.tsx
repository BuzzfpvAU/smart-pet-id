"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dog, Cat, Bird, Rabbit } from "lucide-react";
import { useState } from "react";

interface PetCardProps {
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    age: string | null;
    primaryPhotoUrl: string | null;
    privacyEnabled: boolean;
    tags: { id: string; status: string }[];
  };
}

const speciesIcons: Record<string, React.ElementType> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
};

export function PetCard({ pet }: PetCardProps) {
  const [privacy, setPrivacy] = useState(pet.privacyEnabled);
  const Icon = speciesIcons[pet.species.toLowerCase()] || Dog;
  const activeTags = pet.tags.filter((t) => t.status === "active").length;

  async function togglePrivacy() {
    const newValue = !privacy;
    setPrivacy(newValue);
    await fetch(`/api/pets/${pet.id}/privacy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privacyEnabled: newValue }),
    });
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/dashboard/pets/${pet.id}`}>
        <div className="h-48 bg-muted flex items-center justify-center">
          {pet.primaryPhotoUrl ? (
            <img
              src={pet.primaryPhotoUrl}
              alt={pet.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon className="h-16 w-16 text-muted-foreground/50" />
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/dashboard/pets/${pet.id}`}>
            <h3 className="font-semibold text-lg hover:underline">
              {pet.name}
            </h3>
          </Link>
          <Badge variant={activeTags > 0 ? "default" : "secondary"}>
            {activeTags > 0 ? `${activeTags} tag${activeTags > 1 ? "s" : ""}` : "No tags"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {pet.species}
          {pet.breed ? ` · ${pet.breed}` : ""}
          {pet.age ? ` · ${pet.age}` : ""}
        </p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            Privacy mode
          </span>
          <Switch
            checked={privacy}
            onCheckedChange={togglePrivacy}
            aria-label="Toggle privacy"
          />
        </div>
      </CardContent>
    </Card>
  );
}
