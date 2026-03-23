"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Dog,
  Users,
  ArrowLeft,
  LogOut,
  Layers,
  Package,
  ClipboardCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/tags", label: "Tag Codes", icon: Tag },
  { href: "/admin/tag-types", label: "Tag Types", icon: Layers },
  { href: "/admin/checklist-templates", label: "Checklist Templates", icon: ClipboardCheck },
  { href: "/admin/items", label: "All Items", icon: Package },
  { href: "/admin/pets", label: "All Pets", icon: Dog },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-background p-5">
      <Link href="/admin" className="flex items-center gap-2.5 px-2 pb-4 mb-2">
        <Image src="/logo.png" alt="Tagz.au" width={32} height={32} className="h-8 w-8" />
        <span className="font-display font-bold text-xl tracking-tight">Admin</span>
      </Link>

      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-1.5 mb-6 pb-6 border-b border-border/30 text-xs text-muted-foreground hover:text-accent transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Dashboard
      </Link>

      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
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
