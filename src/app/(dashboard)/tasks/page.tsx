import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { TasksView } from "@/components/tasks/tasks-view";
import { getWorkspaceContext, getWorkspaceMembers } from "@/lib/auth/workspace";
import { getProjects } from "@/lib/queries/projects";
import { getTasks } from "@/lib/queries/tasks";

export const metadata: Metadata = {
  title: "Tasks",
};

type TasksPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
  }>;
};

async function TasksContent({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  const [tasks, projects, members] = await Promise.all([
    getTasks({ q: params.q, status: params.status, priority: params.priority }),
    getProjects(),
    getWorkspaceMembers(ctx.workspaceOwnerId),
  ]);

  return (
    <TasksView
      tasks={tasks}
      projects={projects.map((project) => ({ id: project.id, name: project.name }))}
      members={members}
      canManage={ctx.permissions.manageTasks}
      canUpdateStatus={ctx.permissions.manageTasks || ctx.permissions.viewAssignedTasksOnly}
      currentUserId={ctx.userId}
    />
  );
}

export default function TasksPage(props: TasksPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <TasksContent {...props} />
    </Suspense>
  );
}
