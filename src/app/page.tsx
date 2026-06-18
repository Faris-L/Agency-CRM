import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/constants/app";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="glass-nav sticky top-0 z-50">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "hidden sm:inline-flex",
              )}
            >
              Pricing
            </Link>
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
          <Badge variant="secondary" className="mb-6">
            Agency CRM for modern teams
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Run your agency from one{" "}
            <span className="text-primary">premium dashboard</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Manage clients, projects, tasks, invoices, team members, and files —
            built for small agencies and freelancers who need a real SaaS
            experience.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Start free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              View pricing
            </Link>
          </div>

          <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { label: "Clients & Projects", value: "Unified workflow" },
              { label: "Invoices & Revenue", value: "Track every dollar" },
              { label: "Team & Tasks", value: "Collaborate with clarity" },
            ].map((item) => (
              <div key={item.label} className="glass-panel rounded-2xl p-6 text-left">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
