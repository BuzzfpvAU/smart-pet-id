import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dog, Tag, ScanLine } from "lucide-react";

export default async function AdminOverviewPage() {
  const [userCount, petCount, tagCount, scanCount, activeTagCount, inactiveTagCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.pet.count(),
      prisma.tag.count(),
      prisma.scan.count(),
      prisma.tag.count({ where: { status: "active" } }),
      prisma.tag.count({ where: { status: "inactive" } }),
    ]);

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "text-blue-600" },
    { label: "Total Pets", value: petCount, icon: Dog, color: "text-green-600" },
    { label: "Total Tags", value: tagCount, icon: Tag, color: "text-purple-600" },
    { label: "Total Scans", value: scanCount, icon: ScanLine, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">System statistics at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tag Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active</span>
              <span className="font-semibold text-green-600">{activeTagCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Inactive (Available)</span>
              <span className="font-semibold text-gray-600">{inactiveTagCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Deactivated</span>
              <span className="font-semibold text-red-600">
                {tagCount - activeTagCount - inactiveTagCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
