"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AdminItem {
  id: string;
  name: string;
  createdAt: string;
  user: { name: string; email: string };
  tagType: { name: string; slug: string; color: string };
  tags: { id: string; activationCode: string; status: string }[];
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/items");
      const data = await res.json();
      setItems(data);
    } catch {
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">All Items</h1>
          <p className="text-muted-foreground text-sm">
            View all registered items across all users
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchItems}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: item.tagType.color + "15",
                        color: item.tagType.color,
                      }}
                    >
                      {item.tagType.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{item.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={
                            tag.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {tag.activationCode.slice(0, 9)}...
                        </Badge>
                      ))}
                      {item.tags.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No tags
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No items registered yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
