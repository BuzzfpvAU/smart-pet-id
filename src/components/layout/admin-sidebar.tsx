"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  QrCode,
  LayoutDashboard,
  Tag,
  Dog,
  Users,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/tags", label: "Tag Codes", icon: Tag },
  { href: "/admin/pets", label: "All Pets", icon: Dog },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30 p-4">
      <Link href="/admin" className="flex items-center gap-2 mb-2 px-2">
        <QrCode className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl">Admin Console</span>
      </Link>

      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-1.5 mb-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Dashboard
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
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
      </nav>

      <Button
        variant="ghost"
        className="justify-start gap-3 text-muted-foreground"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </aside>
  );
}
