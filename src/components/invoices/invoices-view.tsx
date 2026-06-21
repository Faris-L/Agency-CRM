"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteInvoiceRecord } from "@/actions/invoices";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListFilters } from "@/components/shared/list-filters";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { UpsellBanner } from "@/components/shared/upsell-banner";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOL, INVOICE_STATUSES } from "@/lib/constants/app";
import type { Client, Project } from "@/types";
import type { InvoiceWithRelations } from "@/lib/queries/invoices";

type InvoicesViewProps = {
  invoices: InvoiceWithRelations[];
  clients: Pick<Client, "id" | "name">[];
  projects: Pick<Project, "id" | "name" | "client_id">[];
  canManage: boolean;
  canExportPdf: boolean;
};

function formatAmount(amount: number) {
  return `${CURRENCY_SYMBOL}${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function InvoicesView({
  invoices,
  clients,
  projects,
  canManage,
  canExportPdf,
}: InvoicesViewProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleSuccess() {
    router.refresh();
  }

  function openCreate() {
    setEditingInvoice(null);
    setFormOpen(true);
  }

  function openEdit(invoice: InvoiceWithRelations) {
    setEditingInvoice(invoice);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteInvoiceRecord({ id: deleteTarget.id });
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Invoice deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  function handlePdfDownload(invoice: InvoiceWithRelations) {
    if (!canExportPdf) {
      toast.error("PDF export requires a Pro or Agency plan.");
      return;
    }

    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Create and manage invoices for your clients."
        actions={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Create invoice
            </Button>
          ) : null
        }
      />

      {!canExportPdf ? (
        <UpsellBanner message="Upgrade to Pro to export professional invoice PDFs." />
      ) : null}

      <ListFilters
        searchPlaceholder="Search by invoice number…"
        statusOptions={INVOICE_STATUSES.map((status) => ({ value: status, label: status }))}
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description={
            canManage
              ? "Create your first invoice to start tracking revenue."
              : "No invoices match your filters."
          }
          action={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Create invoice
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_auto_auto] gap-4 border-b px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
            <span>Invoice #</span>
            <span>Client</span>
            <span>Amount</span>
            <span>Due date</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div>
                  <p className="font-medium">{invoice.invoice_number}</p>
                  {invoice.projects?.name ? (
                    <p className="text-xs text-muted-foreground">{invoice.projects.name}</p>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{invoice.clients?.name ?? "—"}</p>
                <p className="font-medium">{formatAmount(Number(invoice.amount))}</p>
                <p className="text-sm text-muted-foreground">{formatDate(invoice.due_date)}</p>
                <StatusBadge status={invoice.status} />
                {canManage ? (
                  <div className="flex items-center gap-1 sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePdfDownload(invoice)}
                      title={canExportPdf ? "Download PDF" : "Upgrade to export PDF"}
                    >
                      <Download className="size-4" />
                      <span className="sr-only">Download PDF</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(invoice)}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(invoice)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ) : (
                  <span className="hidden sm:block" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editingInvoice}
        clients={clients}
        projects={projects}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete invoice"
        description={`Are you sure you want to delete "${deleteTarget?.invoice_number}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
