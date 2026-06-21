"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getVisibleNavItems,
  isNavActive,
  type NavPermissions,
} from "@/lib/auth/nav";
import { getNavIcon } from "@/lib/auth/nav-icons";
import { cn } from "@/lib/utils";

type NavLinkListProps = {
  permissions: NavPermissions;
  onNavigate?: () => void;
  className?: string;
};

export function NavLinkList({
  permissions,
  onNavigate,
  className,
}: NavLinkListProps) {
  const pathname = usePathname();
  const navItems = getVisibleNavItems(permissions, "sidebar");

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map((item) => {
        const Icon = getNavIcon(item.href);
        const active = isNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
