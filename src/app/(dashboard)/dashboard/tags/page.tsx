import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TagList } from "@/components/tags/tag-list";
import { Plus, Tag } from "lucide-react";

export const metadata = {
  title: "My Tags - Tagz.au",
};

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [tags, pets, items] = await Promise.all([
    prisma.tag.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        activationCode: true,
        shortCode: true,
        status: true,
        qrCodeUrl: true,
        pet: { select: { id: true, name: true, species: true } },
        item: { select: { id: true, name: true, tagType: { select: { name: true } } } },
        _count: { select: { scans: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pet.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, species: true },
    }),
    prisma.item.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, tagType: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Tags</h1>
          <p className="text-muted-foreground text-sm">
            Manage your smart tags
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tags/activate">
            <Plus className="h-4 w-4 mr-2" />
            Activate Tag
          </Link>
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tag className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No tags yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Activate a smart tag by entering the activation code that came with
            your tag.
          </p>
          <Button asChild>
            <Link href="/dashboard/tags/activate">
              <Plus className="h-4 w-4 mr-2" />
              Activate Your First Tag
            </Link>
          </Button>
        </div>
      ) : (
        <TagList tags={tags} pets={pets} items={items} />
      )}
    </div>
  );
}
