"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { NavLinkList } from "@/components/layout/nav-link-list";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getPageTitle, type NavPermissions } from "@/lib/auth/nav";
import { APP_NAME } from "@/lib/constants/app";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  fullName?: string | null;
  email?: string | null;
  permissions: NavPermissions;
  children: React.ReactNode;
};

function AppLogo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2", className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary">
        <Sparkles className="size-4" />
      </div>
      <span className="font-bold tracking-tight text-sidebar-foreground">
        {APP_NAME}
      </span>
    </Link>
  );
}

export function DashboardShell({
  fullName,
  email,
  permissions,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = getPageTitle(pathname, permissions);

  return (
    <div className="min-h-dvh">
      <aside className="glass-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col md:flex">
        <div className="flex h-14 items-center border-b border-border/50 px-4">
          <AppLogo />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinkList permissions={permissions} />
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-60">
        <header className="glass-nav sticky top-0 z-40 flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "md:hidden",
                    )}
                    aria-label="Open navigation menu"
                  >
                    <Menu className="size-4" />
                  </button>
                }
              />
              <SheetContent
                side="left"
                className="glass-sidebar w-72 p-0 text-sidebar-foreground"
              >
                <SheetHeader className="border-b border-border/50">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary">
                      <Sparkles className="size-4" />
                    </div>
                    {APP_NAME}
                  </SheetTitle>
                </SheetHeader>
                <div className="p-3">
                  <NavLinkList
                    permissions={permissions}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {pageTitle}
            </h1>
          </div>
          <UserMenu
            fullName={fullName}
            email={email}
            permissions={permissions}
          />
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
