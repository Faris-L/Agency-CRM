import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpsellBannerProps = {
  message: string;
  className?: string;
};

export function UpsellBanner({ message, className }: UpsellBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </div>
        <p className="text-sm text-foreground">{message}</p>
      </div>
      <Link href="/pricing" className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>
        View plans
      </Link>
    </div>
  );
}
