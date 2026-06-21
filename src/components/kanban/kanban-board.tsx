"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants/app";
import type { ProjectWithClient } from "@/lib/queries/projects";
import { cn } from "@/lib/utils";

type KanbanBoardProps = {
  projects: ProjectWithClient[];
  canManage: boolean;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  updatingId: string | null;
};

const COLUMN_COLORS: Record<ProjectStatus, string> = {
  Planning: "border-t-blue-500/60",
  "In Progress": "border-t-primary",
  Review: "border-t-amber-500/60",
  Completed: "border-t-emerald-500/60",
};

export function KanbanBoard({
  projects,
  canManage,
  onStatusChange,
  updatingId,
}: KanbanBoardProps) {
  const projectsByStatus = PROJECT_STATUSES.reduce(
    (acc, status) => {
      acc[status] = projects.filter((project) => project.status === status);
      return acc;
    },
    {} as Record<ProjectStatus, ProjectWithClient[]>,
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PROJECT_STATUSES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          projects={projectsByStatus[status]}
          canManage={canManage}
          onStatusChange={onStatusChange}
          updatingId={updatingId}
        />
      ))}
    </div>
  );
}

type KanbanColumnProps = {
  status: ProjectStatus;
  projects: ProjectWithClient[];
  canManage: boolean;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  updatingId: string | null;
};

function KanbanColumn({
  status,
  projects,
  canManage,
  onStatusChange,
  updatingId,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: !canManage,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "glass-panel flex min-h-[420px] flex-col rounded-2xl border-t-4 p-4",
        COLUMN_COLORS[status],
        isOver && canManage && "ring-2 ring-primary/40",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{status}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {projects.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {canManage ? "Drop projects here" : "No projects"}
          </p>
        ) : (
          projects.map((project) => (
            <KanbanCard
              key={project.id}
              project={project}
              canManage={canManage}
              onStatusChange={onStatusChange}
              updating={updatingId === project.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
