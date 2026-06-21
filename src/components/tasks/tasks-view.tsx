"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTaskRecord, updateTaskStatus } from "@/actions/tasks";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListFilters } from "@/components/shared/list-filters";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants/app";
import type { TaskWithRelations } from "@/lib/queries/tasks";
import type { Profile, Project, Task } from "@/types";

type TasksViewProps = {
  tasks: TaskWithRelations[];
  projects: Pick<Project, "id" | "name">[];
  members: Pick<Profile, "id" | "full_name" | "email">[];
  canManage: boolean;
  canUpdateStatus: boolean;
  currentUserId: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function assigneeName(task: TaskWithRelations) {
  return task.assignee?.full_name?.trim() || task.assignee?.email || "Unassigned";
}

export function TasksView({
  tasks,
  projects,
  members,
  canManage,
  canUpdateStatus,
  currentUserId,
}: TasksViewProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function handleSuccess() {
    router.refresh();
  }

  function openCreate() {
    if (!hasProjects) {
      toast.error("Create a project first before adding tasks.");
      return;
    }

    setEditingTask(null);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteTaskRecord({ id: deleteTarget.id });
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Task deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  async function handleStatusChange(taskId: string, status: string) {
    setUpdatingId(taskId);
    const result = await updateTaskStatus({
      id: taskId,
      status: status as Task["status"],
    });
    setUpdatingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Task status updated.");
    router.refresh();
  }

  function canEditTask(task: TaskWithRelations) {
    return canManage || task.assigned_user === currentUserId;
  }

  const hasProjects = projects.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Assign work, set priorities, and track progress."
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="size-4" />
              Add task
            </Button>
          ) : null
        }
      />

      {canManage && !hasProjects ? (
        <div className="rounded-2xl border border-border/50 bg-muted/40 p-4 text-sm text-foreground">
          Create a project first before adding tasks.{" "}
          <Link
            href="/projects"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Go to Projects
          </Link>
        </div>
      ) : null}

      <ListFilters
        searchPlaceholder="Search tasks…"
        statusOptions={TASK_STATUSES.map((status) => ({ value: status, label: status }))}
        extraFilters={[
          {
            param: "priority",
            label: "Priority",
            options: TASK_PRIORITIES.map((priority) => ({
              value: priority,
              label: priority,
            })),
          },
        ]}
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description={
            canManage
              ? hasProjects
                ? "Create your first task and assign it to your team."
                : "Create a project first, then add tasks."
              : "No tasks are assigned to you yet."
          }
          action={
            canManage && hasProjects ? (
              <Button type="button" onClick={openCreate}>
                <Plus className="size-4" />
                Add task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto_auto] gap-4 border-b px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase lg:grid">
            <span>Task</span>
            <span>Project</span>
            <span>Assignee</span>
            <span>Due</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="grid gap-3 px-4 py-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto_auto] lg:items-center lg:gap-4"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <div className="mt-1 lg:hidden">
                    <StatusBadge status={task.priority} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{task.projects?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{assigneeName(task)}</p>
                <p className="text-sm text-muted-foreground">{formatDate(task.due_date)}</p>

                <div className="flex items-center gap-2">
                  <StatusBadge status={task.priority} className="hidden lg:inline-flex" />
                  {canUpdateStatus && canEditTask(task) ? (
                    <Select
                      value={task.status}
                      onValueChange={(value) => {
                        if (value) handleStatusChange(task.id, value);
                      }}
                      disabled={updatingId === task.id}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={task.status} />
                  )}
                </div>

                {canManage ? (
                  <div className="flex items-center gap-1 lg:justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(task)}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(task)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ) : (
                  <span className="hidden lg:block" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canManage ? (
        <TaskFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          task={editingTask}
          projects={projects}
          members={members}
          onSuccess={handleSuccess}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete task"
        description={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
