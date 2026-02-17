"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { QrCode, Home, Tag, Settings, LogOut, Shield, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/items/new", label: "Add Item", icon: Plus },
  { href: "/dashboard/tags", label: "My Tags", icon: Tag },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30 p-4">
      <Link href="/dashboard" className="flex items-center gap-2 mb-8 px-2">
        <QrCode className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl">Tagz.au</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t" />
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-300"
            >
              <Shield className="h-4 w-4" />
              Admin Console
            </Link>
          </>
        )}
      </nav>

      <div className="space-y-1">
        <Link
          href="/buy"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-primary hover:bg-primary/10 font-medium"
        >
          <ShoppingCart className="h-4 w-4" />
          Buy a Tag
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
