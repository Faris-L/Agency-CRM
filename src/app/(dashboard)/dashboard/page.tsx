import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import {
  getDashboardStats,
  getMostProfitableClients,
  getRecentActivity,
  getRecentProjects,
  getRevenueByMonth,
  getTasksDueToday,
  getUpcomingDeadlines,
} from "@/lib/queries/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  const [
    stats,
    revenueByMonth,
    profitableClients,
    upcomingDeadlines,
    recentProjects,
    tasksDueToday,
    recentActivity,
  ] = await Promise.all([
    getDashboardStats(ctx.workspaceOwnerId),
    getRevenueByMonth(ctx.workspaceOwnerId),
    getMostProfitableClients(ctx.workspaceOwnerId),
    getUpcomingDeadlines(ctx.workspaceOwnerId),
    getRecentProjects(ctx.workspaceOwnerId),
    getTasksDueToday(),
    getRecentActivity(ctx.workspaceOwnerId),
  ]);

  const displayName =
    ctx.profile.full_name?.trim() || ctx.profile.email?.split("@")[0] || "there";

  return (
    <DashboardView
      displayName={displayName}
      stats={stats}
      revenueByMonth={revenueByMonth}
      profitableClients={profitableClients}
      upcomingDeadlines={upcomingDeadlines}
      recentProjects={recentProjects}
      tasksDueToday={tasksDueToday}
      recentActivity={recentActivity}
      canManageProjects={ctx.permissions.manageProjects}
    />
  );
}
