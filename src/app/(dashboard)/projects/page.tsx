import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsView } from "@/components/projects/projects-view";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import { redirectIfMissingPermission } from "@/lib/auth/page-guards";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getClients } from "@/lib/queries/clients";
import { getProjectCount, getProjects } from "@/lib/queries/projects";

export const metadata: Metadata = {
  title: "Projects",
};

type ProjectsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

async function ProjectsContent({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  redirectIfMissingPermission(ctx, "manageProjects");

  const [projects, clients, projectCount] = await Promise.all([
    getProjects({ q: params.q, status: params.status }),
    getClients(),
    getProjectCount(ctx.workspaceOwnerId),
  ]);

  const maxProjects = PLAN_LIMITS[ctx.plan].maxProjects;
  const atLimit = maxProjects !== null && projectCount >= maxProjects;

  return (
    <ProjectsView
      projects={projects}
      clients={clients.map((client) => ({ id: client.id, name: client.name }))}
      canManage={ctx.permissions.manageProjects}
      plan={ctx.plan}
      atLimit={atLimit}
    />
  );
}

export default function ProjectsPage(props: ProjectsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <ProjectsContent {...props} />
    </Suspense>
  );
}
