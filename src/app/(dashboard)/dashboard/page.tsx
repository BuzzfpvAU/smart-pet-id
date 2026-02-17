import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PetCard } from "@/components/pets/pet-card";
import { ItemCard } from "@/components/items/item-card";
import { Plus, QrCode, Tag, ScanLine, MapPin, Package, ShoppingCart } from "lucide-react";

export const metadata = {
  title: "Dashboard - Tagz.au",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [pets, items, tagCount, recentScans, totalScans] = await Promise.all([
    prisma.pet.findMany({
      where: { userId: session.user.id },
      include: { tags: { select: { id: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.item.findMany({
      where: { userId: session.user.id },
      include: {
        tagType: { select: { slug: true, name: true, icon: true, color: true } },
        tags: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tag.count({
      where: { userId: session.user.id, status: "active" },
    }),
    prisma.scan.findMany({
      where: { tag: { userId: session.user.id } },
      include: {
        tag: {
          include: {
            pet: { select: { name: true } },
            item: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.scan.count({
      where: { tag: { userId: session.user.id } },
    }),
  ]);

  const totalItems = pets.length + items.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, {session.user.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/items/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">
                Item{totalItems !== 1 ? "s" : ""} registered
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tagCount}</p>
              <p className="text-sm text-muted-foreground">
                Active tag{tagCount !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <ScanLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalScans}</p>
              <p className="text-sm text-muted-foreground">
                Total scan{totalScans !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {recentScans.map((scan) => {
                const itemName =
                  scan.tag.item?.name || scan.tag.pet?.name || "Unlinked tag";
                return (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <ScanLine className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {itemName} was scanned
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(scan.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {scan.latitude && scan.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          Location
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No location
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items Grid */}
      {items.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Items</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Pets Grid (legacy) */}
      {pets.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Pet Profiles</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <QrCode className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No items yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Add your first item to create a profile and link it to a smart tag.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/dashboard/items/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/buy">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy a Tag
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
