import Link from "next/link";
import {
  Activity,
  CalendarClock,
  CheckSquare,
  DollarSign,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import {
  RevenueByMonthChart,
  RevenueTrendChart,
  TaskCompletionMetric,
} from "@/components/dashboard/revenue-charts";
import { ChartCard } from "@/components/shared/chart-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { CURRENCY_SYMBOL } from "@/lib/constants/app";
import type {
  ActivityWithActor,
  DashboardStats,
  ProfitableClient,
  RevenueMonth,
} from "@/lib/queries/dashboard";
import type { ProjectWithClient } from "@/lib/queries/projects";
import type { TaskWithRelations } from "@/lib/queries/tasks";
import { cn } from "@/lib/utils";

type DashboardViewProps = {
  displayName: string;
  stats: DashboardStats;
  revenueByMonth: RevenueMonth[];
  profitableClients: ProfitableClient[];
  upcomingDeadlines: ProjectWithClient[];
  recentProjects: ProjectWithClient[];
  tasksDueToday: TaskWithRelations[];
  recentActivity: ActivityWithActor[];
  canManageProjects: boolean;
};

function formatCurrency(value: number) {
  return `${CURRENCY_SYMBOL}${value.toLocaleString("en-US")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(value);
}

function WidgetList({
  title,
  description,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  description?: string;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <ChartCard title={title} description={description}>
      {isEmpty ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="divide-y">{children}</ul>
      )}
    </ChartCard>
  );
}

export function DashboardView({
  displayName,
  stats,
  revenueByMonth,
  profitableClients,
  upcomingDeadlines,
  recentProjects,
  tasksDueToday,
  recentActivity,
  canManageProjects,
}: DashboardViewProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Your agency overview — clients, revenue, projects, and tasks at a glance."
        actions={
          canManageProjects ? (
            <Link href="/kanban" className={cn(buttonVariants())}>
              <FolderKanban className="size-4" />
              Kanban board
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Clients"
          value={stats.activeClients}
          icon={TrendingUp}
          description="Clients with Active status"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={FolderKanban}
          description="Planning, In Progress, or Review"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          description="Paid invoices this month"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckSquare}
          description={`${stats.taskCompletionRate}% completion rate`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueByMonthChart data={revenueByMonth} />
        <RevenueTrendChart data={revenueByMonth} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TaskCompletionMetric
          rate={stats.taskCompletionRate}
          completed={stats.completedTasks}
          total={stats.totalTasks}
        />

        <WidgetList
          title="Most Profitable Clients"
          description="Top clients by paid invoice revenue"
          emptyMessage="No paid invoices yet"
          isEmpty={profitableClients.length === 0}
        >
          {profitableClients.map((client) => (
            <li
              key={client.name}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="truncate text-sm font-medium">{client.name}</span>
              <span className="shrink-0 text-sm font-semibold text-primary">
                {formatCurrency(client.totalRevenue)}
              </span>
            </li>
          ))}
        </WidgetList>

        <WidgetList
          title="Upcoming Deadlines"
          description="Projects due soon"
          emptyMessage="No upcoming deadlines"
          isEmpty={upcomingDeadlines.length === 0}
        >
          {upcomingDeadlines.map((project) => (
            <li
              key={project.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{project.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {project.clients?.name ?? "—"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">
                  {formatDate(project.deadline)}
                </span>
                <StatusBadge status={project.status} />
              </div>
            </li>
          ))}
        </WidgetList>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WidgetList
          title="Recent Projects"
          description="Latest project activity"
          emptyMessage="No projects yet"
          isEmpty={recentProjects.length === 0}
        >
          {recentProjects.map((project) => (
            <li
              key={project.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{project.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {project.clients?.name ?? "—"}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </li>
          ))}
        </WidgetList>

        <WidgetList
          title="Tasks Due Today"
          description="Open tasks with today's due date"
          emptyMessage="No tasks due today"
          isEmpty={tasksDueToday.length === 0}
        >
          {tasksDueToday.map((task) => (
            <li
              key={task.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {task.projects?.name ?? "—"}
                </p>
              </div>
              <StatusBadge status={task.priority} />
            </li>
          ))}
        </WidgetList>

        <WidgetList
          title="Recent Activity"
          description="Latest workspace events"
          emptyMessage="No activity yet"
          isEmpty={recentActivity.length === 0}
        >
          {recentActivity.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{entry.action}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {entry.actor?.full_name?.trim() || entry.actor?.email || "System"} ·{" "}
                  {formatRelativeTime(entry.created_at)}
                </p>
              </div>
            </li>
          ))}
        </WidgetList>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/clients" className={cn(buttonVariants({ variant: "outline" }))}>
          View clients
        </Link>
        <Link href="/projects" className={cn(buttonVariants({ variant: "outline" }))}>
          View projects
        </Link>
        <Link href="/tasks" className={cn(buttonVariants({ variant: "outline" }))}>
          <CalendarClock className="size-4" />
          View tasks
        </Link>
      </div>
    </div>
  );
}
