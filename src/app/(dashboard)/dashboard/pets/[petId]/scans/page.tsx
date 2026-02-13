import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Phone, Clock } from "lucide-react";

export const metadata = {
  title: "Scan History - Smart Pet ID",
};

export default async function ScanHistoryPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { petId } = await params;

  const pet = await prisma.pet.findFirst({
    where: { id: petId, userId: session.user.id },
    include: {
      tags: {
        include: {
          scans: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      },
    },
  });

  if (!pet) notFound();

  const allScans = pet.tags
    .flatMap((tag) =>
      tag.scans.map((scan) => ({
        ...scan,
        tagCode: tag.activationCode,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/pets/${petId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Scan History for {pet.name}</h1>
          <p className="text-muted-foreground text-sm">
            {allScans.length} scan{allScans.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      {allScans.length === 0 ? (
        <div className="text-center py-20">
          <MapPin className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No scans yet</h2>
          <p className="text-muted-foreground">
            When someone scans your pet&apos;s tag, the scan details will appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allScans.map((scan) => (
            <Card key={scan.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {new Date(scan.createdAt).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scan.latitude && scan.longitude ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <a
                        href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View on Google Maps
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {scan.latitude.toFixed(6)}, {scan.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location not shared
                  </p>
                )}
                {scan.finderPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <a
                      href={`tel:${scan.finderPhone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {scan.finderPhone}
                    </a>
                  </div>
                )}
                {scan.finderMessage && (
                  <p className="text-sm bg-muted p-2 rounded">
                    {scan.finderMessage}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
