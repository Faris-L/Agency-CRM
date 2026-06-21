import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { InvoicesView } from "@/components/invoices/invoices-view";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import { getClients } from "@/lib/queries/clients";
import { getInvoices } from "@/lib/queries/invoices";
import { getProjects } from "@/lib/queries/projects";

export const metadata: Metadata = {
  title: "Invoices",
};

type InvoicesPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

async function InvoicesContent({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  if (!ctx.permissions.manageInvoices) {
    redirect("/dashboard");
  }

  const [invoices, clients, projects] = await Promise.all([
    getInvoices({ q: params.q, status: params.status }),
    getClients(),
    getProjects(),
  ]);

  const canExportPdf = PLAN_LIMITS[ctx.plan].pdfExport;

  return (
    <InvoicesView
      invoices={invoices}
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      projects={projects.map((p) => ({ id: p.id, name: p.name, client_id: p.client_id }))}
      canManage={ctx.permissions.manageInvoices}
      canExportPdf={canExportPdf}
    />
  );
}

export default function InvoicesPage(props: InvoicesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <InvoicesContent {...props} />
    </Suspense>
  );
}
