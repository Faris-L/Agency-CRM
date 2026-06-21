import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientsView } from "@/components/clients/clients-view";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import { redirectIfMissingPermission } from "@/lib/auth/page-guards";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getClientCount, getClients } from "@/lib/queries/clients";

export const metadata: Metadata = {
  title: "Clients",
};

type ClientsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

async function ClientsContent({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  redirectIfMissingPermission(ctx, "manageClients");

  const [clients, clientCount] = await Promise.all([
    getClients({ q: params.q, status: params.status }),
    getClientCount(ctx.workspaceOwnerId),
  ]);

  const maxClients = PLAN_LIMITS[ctx.plan].maxClients;
  const atLimit = maxClients !== null && clientCount >= maxClients;

  return (
    <ClientsView
      clients={clients}
      canManage={ctx.permissions.manageClients}
      plan={ctx.plan}
      atLimit={atLimit}
    />
  );
}

export default function ClientsPage(props: ClientsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <ClientsContent {...props} />
    </Suspense>
  );
}
