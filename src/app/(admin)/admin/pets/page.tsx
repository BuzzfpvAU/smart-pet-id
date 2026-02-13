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
import { RefreshCw } from "lucide-react";

interface PetData {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  createdAt: string;
  user: { name: string; email: string };
  tags: { id: string; activationCode: string; status: string }[];
}

export default function AdminPetsPage() {
  const [pets, setPets] = useState<PetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/pets");
      const data = await res.json();
      setPets(data.pets || []);
    } catch (err) {
      console.error("Failed to fetch pets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Pets</h1>
          <p className="text-muted-foreground">
            View all registered pets across all users
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchPets}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Species</TableHead>
              <TableHead>Breed</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : pets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No pets registered yet.
                </TableCell>
              </TableRow>
            ) : (
              pets.map((pet) => (
                <TableRow key={pet.id}>
                  <TableCell className="font-medium">{pet.name}</TableCell>
                  <TableCell className="capitalize">{pet.species}</TableCell>
                  <TableCell>{pet.breed || "-"}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{pet.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {pet.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pet.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pet.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant={tag.status === "active" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {tag.activationCode.slice(0, 8)}...
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No tags</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(pet.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
