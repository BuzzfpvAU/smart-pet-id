import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

export const metadata = {
  title: "My Orders - Tagz.au",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  PAID: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PROCESSING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  SHIPPED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  DELIVERED: "bg-green-500/10 text-green-600 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
  REFUNDED: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function DashboardOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">No orders yet</h1>
        <p className="text-muted-foreground mb-8">
          Purchase some smart tags to get started
        </p>
        <Link href="/shop">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Browse Shop
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
            <Card className="border-border/50 hover:border-accent/30 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                    <Badge variant="secondary" className={STATUS_COLORS[order.status] || ""}>
                      {order.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {order.orderItems.map((i) => `${i.product.name} × ${i.quantity}`).join(", ")}
                  </div>
                  <span className="font-mono font-medium">{formatPrice(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
