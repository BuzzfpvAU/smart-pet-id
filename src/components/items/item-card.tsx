"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTagTypeIcon } from "./type-selector";

interface ItemCardProps {
  item: {
    id: string;
    name: string;
    primaryPhotoUrl: string | null;
    tagType: {
      slug: string;
      name: string;
      icon: string;
      color: string;
    };
    tags: { id: string; status: string }[];
  };
}

export function ItemCard({ item }: ItemCardProps) {
  const Icon = getTagTypeIcon(item.tagType.icon);
  const linkedTags = item.tags.filter((t) => t.status === "active").length;

  return (
    <Link href={`/dashboard/items/${item.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {item.primaryPhotoUrl ? (
              <img
                src={item.primaryPhotoUrl}
                alt={item.name}
                className="w-12 h-12 rounded-full object-cover border-2"
                style={{ borderColor: item.tagType.color + "40" }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: item.tagType.color + "20" }}
              >
                <div style={{ color: item.tagType.color }}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: item.tagType.color + "15",
                    color: item.tagType.color,
                  }}
                >
                  {item.tagType.name}
                </Badge>
                {linkedTags > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {linkedTags} tag{linkedTags !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
