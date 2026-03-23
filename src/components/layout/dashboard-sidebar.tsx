"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, Tag, Settings, LogOut, Shield, Plus, ShoppingCart } from "lucide-react";
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
    <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-background p-5">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 pb-6 border-b border-border/30 mb-6">
        <Image src="/logo.svg" alt="Tagz.au" width={32} height={32} className="h-8 w-8" />
        <span className="font-display font-bold text-xl tracking-tight">Tagz.au</span>
      </Link>

      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                isActive
                  ? "bg-accent/10 text-accent border-l-2 border-accent font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-0.5"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-border/30" />
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <Shield className="h-4 w-4" />
              Admin Console
            </Link>
          </>
        )}
      </nav>

      <div className="space-y-1.5">
        <Link
          href="/buy"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 text-accent hover:bg-accent/10 font-medium"
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
