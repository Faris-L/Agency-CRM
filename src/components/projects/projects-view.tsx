"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProjectRecord } from "@/actions/projects";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListFilters } from "@/components/shared/list-filters";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { UpsellBanner } from "@/components/shared/upsell-banner";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOL, PROJECT_STATUSES } from "@/lib/constants/app";
import { getPlanLimitMessage, type Plan } from "@/lib/constants/plans";
import type { Client, Project } from "@/types";
import type { ProjectWithClient } from "@/lib/queries/projects";

type ProjectsViewProps = {
  projects: ProjectWithClient[];
  clients: Pick<Client, "id" | "name">[];
  canManage: boolean;
  plan: Plan;
  atLimit: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBudget(value: number | null) {
  if (value === null || value === undefined) return "—";
  return `${CURRENCY_SYMBOL}${value.toLocaleString("en-US")}`;
}

export function ProjectsView({
  projects,
  clients,
  canManage,
  plan,
  atLimit,
}: ProjectsViewProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleSuccess() {
    router.refresh();
  }

  function openCreate() {
    setEditingProject(null);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteProjectRecord({ id: deleteTarget.id });
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Project deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  const hasClients = clients.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Track project progress, budgets, and deadlines."
        actions={
          canManage ? (
            <Button onClick={openCreate} disabled={atLimit || !hasClients}>
              <Plus className="size-4" />
              Add project
            </Button>
          ) : null
        }
      />

      {canManage && atLimit ? (
        <UpsellBanner message={getPlanLimitMessage(plan, "projects")} />
      ) : null}

      {canManage && !hasClients ? (
        <UpsellBanner message="Create a client first before adding projects." />
      ) : null}

      <ListFilters
        searchPlaceholder="Search projects…"
        statusOptions={PROJECT_STATUSES.map((status) => ({ value: status, label: status }))}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            canManage
              ? hasClients
                ? "Create your first project to start tracking work."
                : "Add a client first, then create a project."
              : "No projects match your filters."
          }
          action={
            canManage && hasClients ? (
              <Button onClick={openCreate} disabled={atLimit}>
                <Plus className="size-4" />
                Add project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto_auto] gap-4 border-b px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
            <span>Project</span>
            <span>Client</span>
            <span>Budget</span>
            <span>Deadline</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y">
            {projects.map((project) => (
              <li
                key={project.id}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {project.clients?.name ?? "—"}
                  </p>
                </div>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {project.clients?.name ?? "—"}
                </p>
                <p className="text-sm">{formatBudget(project.budget)}</p>
                <p className="text-sm text-muted-foreground">{formatDate(project.deadline)}</p>
                <StatusBadge status={project.status} />
                {canManage ? (
                  <div className="flex items-center gap-1 sm:justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(project)}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(project)}
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

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        clients={clients}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All associated tasks will also be removed.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
