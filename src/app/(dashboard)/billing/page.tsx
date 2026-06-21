import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSubscription } from "@/actions/billing";
import { BillingView } from "@/components/billing/billing-view";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { getWorkspaceContext } from "@/lib/auth/workspace";

export const metadata: Metadata = {
  title: "Billing",
};

async function BillingContent() {
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  if (!ctx.permissions.manageBilling) {
    redirect("/dashboard");
  }

  const subscription = await getSubscription();

  if (!subscription) {
    redirect("/dashboard");
  }

  return (
    <BillingView
      subscription={subscription}
      canManage={ctx.permissions.manageBilling}
    />
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
