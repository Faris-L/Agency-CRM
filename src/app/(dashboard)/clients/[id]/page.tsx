import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClientDetailView } from "@/components/clients/client-detail-view";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { redirectIfMissingPermission } from "@/lib/auth/page-guards";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getClientById } from "@/lib/queries/clients";
import { getClientFilesByClientId } from "@/lib/queries/client-files";
import { getInvoices } from "@/lib/queries/invoices";
import { getNotesByClientId } from "@/lib/queries/notes";
import { getProjects } from "@/lib/queries/projects";

export const metadata: Metadata = {
  title: "Client Details",
};

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function ClientDetailContent({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  redirectIfMissingPermission(ctx, "manageClients");

  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  const [projects, invoices, notes, files] = await Promise.all([
    getProjects({ clientId: id }),
    ctx.permissions.manageInvoices ? getInvoices({ clientId: id }) : Promise.resolve([]),
    getNotesByClientId(id),
    getClientFilesByClientId(id),
  ]);

  return (
    <ClientDetailView
      client={client}
      projects={projects}
      invoices={invoices}
      notes={notes}
      files={files}
      canManage={ctx.permissions.manageClients}
      canViewInvoices={ctx.permissions.manageInvoices}
    />
  );
}

export default function ClientDetailPage(props: ClientDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <ClientDetailContent {...props} />
    </Suspense>
  );
}
