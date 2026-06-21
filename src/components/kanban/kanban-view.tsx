"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { FolderKanban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { updateProjectStatus } from "@/actions/projects";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanCardPreview } from "@/components/kanban/kanban-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants/app";
import type { ProjectWithClient } from "@/lib/queries/projects";

type KanbanViewProps = {
  projects: ProjectWithClient[];
  canManage: boolean;
};

export function KanbanView({ projects: initialProjects, canManage }: KanbanViewProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeId) ?? null,
    [projects, activeId],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function applyStatusChange(projectId: string, status: ProjectStatus) {
    const project = projects.find((item) => item.id === projectId);
    if (!project || project.status === status) return;

    const previous = projects;
    setProjects((current) =>
      current.map((item) => (item.id === projectId ? { ...item, status } : item)),
    );
    setUpdatingId(projectId);

    const result = await updateProjectStatus({ id: projectId, status });
    setUpdatingId(null);

    if (!result.success) {
      setProjects(previous);
      toast.error(result.error);
      return;
    }

    toast.success(`Moved to ${status}`);
    router.refresh();
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const { active, over } = event;
    if (!over || !canManage) return;

    const projectId = String(active.id);
    const newStatus = String(over.id) as ProjectStatus;

    if (!PROJECT_STATUSES.includes(newStatus)) return;

    await applyStatusChange(projectId, newStatus);
  }

  async function handleStatusChange(projectId: string, status: ProjectStatus) {
    if (!canManage) return;
    await applyStatusChange(projectId, status);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Kanban"
        description={
          canManage
            ? "Drag projects between columns or use the status dropdown on each card."
            : "View project progress across workflow stages."
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            canManage
              ? "Create a project first, then organize it on the Kanban board."
              : "No projects are available in this workspace."
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <KanbanBoard
            projects={projects}
            canManage={canManage}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
          <DragOverlay>
            {activeProject ? <KanbanCardPreview project={activeProject} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
