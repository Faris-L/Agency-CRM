"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { ClientFilesSection } from "@/components/clients/client-files-section";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientNotesSection } from "@/components/clients/client-notes-section";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENCY_SYMBOL } from "@/lib/constants/app";
import { cn } from "@/lib/utils";
import type { ClientFileWithUploader } from "@/lib/queries/client-files";
import type { InvoiceWithRelations } from "@/lib/queries/invoices";
import type { NoteWithAuthor } from "@/lib/queries/notes";
import type { ProjectWithClient } from "@/lib/queries/projects";
import type { Client } from "@/types";

type ClientDetailViewProps = {
  client: Client;
  projects: ProjectWithClient[];
  invoices: InvoiceWithRelations[];
  notes: NoteWithAuthor[];
  files: ClientFileWithUploader[];
  canManage: boolean;
  canViewInvoices: boolean;
};

function formatAmount(amount: number) {
  return `${CURRENCY_SYMBOL}${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ClientDetailView({
  client,
  projects,
  invoices,
  notes,
  files,
  canManage,
  canViewInvoices,
}: ClientDetailViewProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/clients" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </div>

      <PageHeader
        title={client.name}
        description={client.company ?? undefined}
        actions={
          canManage ? (
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Pencil className="size-4" />
              Edit client
            </Button>
          ) : null
        }
      />

      <div className="glass-panel grid gap-4 rounded-2xl p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Status</p>
          <div className="mt-2">
            <StatusBadge status={client.status} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Email</p>
          <p className="mt-2 text-sm">{client.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Phone</p>
          <p className="mt-2 text-sm">{client.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Added</p>
          <p className="mt-2 text-sm">{formatDate(client.created_at)}</p>
        </div>
        {client.notes ? (
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Internal notes
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">{client.notes}</p>
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
          {canViewInvoices ? (
            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          ) : null}
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects linked to this client.</p>
          ) : (
            <div className="glass-panel overflow-hidden rounded-2xl">
              <ul className="divide-y">
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Deadline: {formatDate(project.deadline)}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {canViewInvoices ? (
          <TabsContent value="invoices" className="mt-4">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices for this client.</p>
            ) : (
              <div className="glass-panel overflow-hidden rounded-2xl">
                <ul className="divide-y">
                  {invoices.map((invoice) => (
                    <li
                      key={invoice.id}
                      className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium">{formatAmount(invoice.amount)}</p>
                        <StatusBadge status={invoice.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        ) : null}

        <TabsContent value="notes" className="mt-4">
          <ClientNotesSection clientId={client.id} notes={notes} canManage={canManage} />
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <ClientFilesSection clientId={client.id} files={files} canManage={canManage} />
        </TabsContent>
      </Tabs>

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={client}
        onSuccess={() => {
          router.refresh();
          setFormOpen(false);
        }}
      />
    </div>
  );
}
