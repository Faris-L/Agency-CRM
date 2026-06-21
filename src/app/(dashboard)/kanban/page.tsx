import type { Metadata } from "next";
import { Suspense } from "react";
import { KanbanView } from "@/components/kanban/kanban-view";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { redirectIfMissingPermission } from "@/lib/auth/page-guards";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getProjects } from "@/lib/queries/projects";

export const metadata: Metadata = {
  title: "Kanban",
};

async function KanbanContent() {
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  redirectIfMissingPermission(ctx, "manageProjects");

  const projects = await getProjects();

  return (
    <KanbanView projects={projects} canManage={ctx.permissions.manageProjects} />
  );
}

export default function KanbanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <KanbanContent />
    </Suspense>
  );
}
