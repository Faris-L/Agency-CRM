import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants/app";
import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  fullName?: string | null;
  email?: string | null;
};

export function DashboardHeader({ fullName, email }: DashboardHeaderProps) {
  const displayName = fullName?.trim() || email || "User";

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {displayName}
          </span>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
