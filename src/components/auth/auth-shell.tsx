import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants/app";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="glass-nav">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
