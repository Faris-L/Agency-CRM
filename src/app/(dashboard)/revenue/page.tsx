import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RevenueView } from "@/components/revenue/revenue-view";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getRevenuePageData } from "@/lib/queries/revenue";

export const metadata: Metadata = {
  title: "Revenue",
};

async function RevenueContent() {
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  if (!ctx.permissions.manageInvoices) {
    redirect("/dashboard");
  }

  const data = await getRevenuePageData(ctx.workspaceOwnerId);

  return <RevenueView {...data} />;
}

export default function RevenuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <RevenueContent />
    </Suspense>
  );
}
