"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteClientRecord } from "@/actions/clients";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListFilters } from "@/components/shared/list-filters";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { UpsellBanner } from "@/components/shared/upsell-banner";
import { Button } from "@/components/ui/button";
import { CLIENT_STATUSES } from "@/lib/constants/app";
import { getPlanLimitMessage, type Plan } from "@/lib/constants/plans";
import type { Client } from "@/types";

type ClientsViewProps = {
  clients: Client[];
  canManage: boolean;
  plan: Plan;
  atLimit: boolean;
};

export function ClientsView({ clients, canManage, plan, atLimit }: ClientsViewProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleSuccess() {
    router.refresh();
  }

  function openCreate() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteClientRecord({ id: deleteTarget.id });
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Client deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your agency clients and track their status."
        actions={
          canManage ? (
            <Button onClick={openCreate} disabled={atLimit}>
              <Plus className="size-4" />
              Add client
            </Button>
          ) : null
        }
      />

      {canManage && atLimit ? (
        <UpsellBanner message={getPlanLimitMessage(plan, "clients")} />
      ) : null}

      <ListFilters
        searchPlaceholder="Search clients…"
        statusOptions={CLIENT_STATUSES.map((status) => ({ value: status, label: status }))}
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description={
            canManage
              ? "Add your first client to start managing projects and tasks."
              : "No clients match your filters."
          }
          action={
            canManage ? (
              <Button onClick={openCreate} disabled={atLimit}>
                <Plus className="size-4" />
                Add client
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_auto_auto] gap-4 border-b px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
            <span>Name</span>
            <span>Company</span>
            <span>Contact</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y">
            {clients.map((client) => (
              <li
                key={client.id}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[1.5fr_1fr_1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div>
                  <Link
                    href={`/clients/${client.id}`}
                    className="group inline-flex items-center gap-1 font-medium hover:text-primary"
                  >
                    {client.name}
                    <ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <p className="text-xs text-muted-foreground sm:hidden">{client.company ?? "—"}</p>
                </div>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {client.company ?? "—"}
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>{client.email ?? "—"}</p>
                  {client.phone ? <p className="text-xs">{client.phone}</p> : null}
                </div>
                <StatusBadge status={client.status} />
                {canManage ? (
                  <div className="flex items-center gap-1 sm:justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(client)}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(client)}
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

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editingClient}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete client"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove associated projects and data.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
