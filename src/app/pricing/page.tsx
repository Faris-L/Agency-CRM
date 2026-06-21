import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PLAN_FEATURES,
  PLAN_LIMITS,
  PLAN_PRICES,
  PLANS,
} from "@/lib/constants/plans";
import { APP_NAME } from "@/lib/constants/app";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="glass-nav sticky top-0 z-50">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="flex items-center gap-2">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Plans that grow with your agency
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start free and upgrade when you need unlimited clients, PDF exports,
            or team collaboration. All billing is demo-only — no real payments.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, index) => {
            const isPopular = plan === "Pro";

            return (
              <div
                key={plan}
                className={cn(
                  "glass-panel relative flex flex-col rounded-2xl p-8",
                  isPopular && "ring-2 ring-primary lg:scale-105",
                )}
              >
                {isPopular ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most popular
                  </Badge>
                ) : null}

                <div className="mb-6">
                  <h2 className="text-xl font-bold">{plan}</h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${PLAN_PRICES[plan]}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {PLAN_FEATURES[plan].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                  {PLAN_LIMITS[plan].pdfExport ? (
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      Professional PDF export
                    </li>
                  ) : null}
                  {PLAN_LIMITS[plan].teamMembers ? (
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      Team member invites
                    </li>
                  ) : null}
                </ul>

                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: isPopular ? "default" : "outline" }),
                    "w-full",
                  )}
                >
                  {index === 0 ? "Start free" : `Get ${plan}`}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/billing" className="font-medium text-primary hover:underline">
            Manage billing in your dashboard
          </Link>
        </p>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
