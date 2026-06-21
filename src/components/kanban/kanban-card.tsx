"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_SYMBOL, PROJECT_STATUSES } from "@/lib/constants/app";
import type { ProjectWithClient } from "@/lib/queries/projects";
import { cn } from "@/lib/utils";

type KanbanCardProps = {
  project: ProjectWithClient;
  canManage: boolean;
  onStatusChange: (projectId: string, status: ProjectWithClient["status"]) => void;
  updating: boolean;
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatBudget(value: number | null) {
  if (value === null || value === undefined) return null;
  return `${CURRENCY_SYMBOL}${value.toLocaleString("en-US")}`;
}

export function KanbanCard({
  project,
  canManage,
  onStatusChange,
  updating,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    disabled: !canManage,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const deadline = formatDate(project.deadline);
  const budget = formatBudget(project.budget);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "glass-panel rounded-xl border p-4 shadow-sm transition-shadow",
        isDragging && "opacity-50 shadow-lg",
        canManage && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-start gap-2">
        {canManage ? (
          <button
            type="button"
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Drag project"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-medium leading-snug">{project.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {project.clients?.name ?? "No client"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {budget ? <span>{budget}</span> : null}
            {deadline ? (
              <span className={cn(budget && "before:mr-2 before:content-['·']")}>
                Due {deadline}
              </span>
            ) : null}
          </div>

          {canManage ? (
            <Select
              value={project.status}
              onValueChange={(value) =>
                onStatusChange(project.id, value as ProjectWithClient["status"])
              }
              disabled={updating}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <StatusBadge status={project.status} />
          )}
        </div>
      </div>
    </div>
  );
}

export function KanbanCardPreview({ project }: { project: ProjectWithClient }) {
  return (
    <div className="glass-panel rotate-2 rounded-xl border p-4 shadow-xl">
      <p className="font-medium">{project.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {project.clients?.name ?? "No client"}
      </p>
    </div>
  );
}
