"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { switchSubscriptionPlan } from "@/actions/billing";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PLAN_FEATURES,
  PLAN_LIMITS,
  PLAN_PRICES,
  PLANS,
  type Plan,
} from "@/lib/constants/plans";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/types";

type BillingViewProps = {
  subscription: Subscription;
  canManage: boolean;
};

export function BillingView({ subscription, canManage }: BillingViewProps) {
  const router = useRouter();
  const [switchingPlan, setSwitchingPlan] = useState<Plan | null>(null);

  async function handleSwitchPlan(plan: Plan) {
    if (plan === subscription.plan) return;

    setSwitchingPlan(plan);
    const result = await switchSubscriptionPlan({ plan });
    setSwitchingPlan(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Switched to ${plan} plan.`);
    router.refresh();
  }

  const createdDate = new Date(subscription.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription plan. Payments are demo-only — no real charges."
      />

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current plan</p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-2xl font-bold">{subscription.plan}</h2>
              <Badge variant={subscription.status === "Active" ? "default" : "secondary"}>
                {subscription.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Subscribed since {createdDate}
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {PLAN_FEATURES[subscription.plan as Plan].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {canManage ? (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Switch plan (demo)</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = plan === subscription.plan;
              const isLoading = switchingPlan === plan;

              return (
                <div
                  key={plan}
                  className={cn(
                    "glass-panel flex flex-col rounded-2xl p-6",
                    isCurrent && "ring-2 ring-primary",
                  )}
                >
                  <div className="mb-4">
                    <h4 className="text-lg font-bold">{plan}</h4>
                    <p className="mt-1 text-2xl font-bold">
                      ${PLAN_PRICES[plan]}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-2">
                    {PLAN_FEATURES[plan].map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                    {PLAN_LIMITS[plan].pdfExport ? (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        PDF Export
                      </li>
                    ) : null}
                  </ul>

                  <Button
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent || isLoading}
                    onClick={() => handleSwitchPlan(plan)}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Switching…
                      </>
                    ) : isCurrent ? (
                      "Current plan"
                    ) : (
                      `Switch to ${plan}`
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
