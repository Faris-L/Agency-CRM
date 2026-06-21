import { createClient } from "@/lib/supabase/server";
import type { ActivityLog } from "@/types";
import type { ProjectWithClient } from "@/lib/queries/projects";
import type { TaskWithRelations } from "@/lib/queries/tasks";

export type DashboardStats = {
  activeClients: number;
  activeProjects: number;
  monthlyRevenue: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletionRate: number;
};

export type RevenueMonth = {
  month: string;
  revenue: number;
};

export type ProfitableClient = {
  name: string;
  totalRevenue: number;
};

export type ActivityWithActor = ActivityLog & {
  actor: { full_name: string | null; email: string } | null;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildRecentMonths(count: number) {
  const months: { key: string; label: string }[] = [];
  const cursor = getMonthStart();

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
    months.push({ key, label });
  }

  return months;
}

export async function getDashboardStats(workspaceOwnerId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const monthStart = getMonthStart().toISOString();

  const [clientsRes, projectsRes, invoicesRes, tasksRes] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", workspaceOwnerId)
      .eq("status", "Active"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", workspaceOwnerId)
      .in("status", ["Planning", "In Progress", "Review"]),
    supabase
      .from("invoices")
      .select("amount")
      .eq("user_id", workspaceOwnerId)
      .eq("status", "Paid")
      .gte("created_at", monthStart),
    supabase
      .from("tasks")
      .select("status, projects!inner(user_id)")
      .eq("projects.user_id", workspaceOwnerId),
  ]);

  const monthlyRevenue = (invoicesRes.data ?? []).reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );

  const tasks = tasksRes.data ?? [];
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  const totalTasks = tasks.length;
  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    activeClients: clientsRes.count ?? 0,
    activeProjects: projectsRes.count ?? 0,
    monthlyRevenue,
    completedTasks,
    totalTasks,
    taskCompletionRate,
  };
}

export async function getRevenueByMonth(workspaceOwnerId: string): Promise<RevenueMonth[]> {
  const supabase = await createClient();
  const months = buildRecentMonths(6);
  const rangeStart = getMonthStart(
    new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
  );

  const { data, error } = await supabase
    .from("invoices")
    .select("amount, created_at")
    .eq("user_id", workspaceOwnerId)
    .eq("status", "Paid")
    .gte("created_at", rangeStart.toISOString());

  if (error) {
    console.error("Failed to fetch revenue by month:", error.message);
    return months.map((month) => ({ month: month.label, revenue: 0 }));
  }

  const totals = new Map<string, number>();
  for (const month of months) {
    totals.set(month.key, 0);
  }

  for (const invoice of data ?? []) {
    const created = new Date(invoice.created_at);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + Number(invoice.amount));
    }
  }

  return months.map((month) => ({
    month: month.label,
    revenue: totals.get(month.key) ?? 0,
  }));
}

export async function getMostProfitableClients(
  workspaceOwnerId: string,
  limit = 5,
): Promise<ProfitableClient[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("amount, clients(name)")
    .eq("user_id", workspaceOwnerId)
    .eq("status", "Paid");

  if (error) {
    console.error("Failed to fetch profitable clients:", error.message);
    return [];
  }

  const totals = new Map<string, number>();

  for (const invoice of data ?? []) {
    const name = invoice.clients?.name ?? "Unknown client";
    totals.set(name, (totals.get(name) ?? 0) + Number(invoice.amount));
  }

  return [...totals.entries()]
    .map(([name, totalRevenue]) => ({ name, totalRevenue }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}

export async function getUpcomingDeadlines(
  workspaceOwnerId: string,
  limit = 5,
): Promise<ProjectWithClient[]> {
  const supabase = await createClient();
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, name)")
    .eq("user_id", workspaceOwnerId)
    .neq("status", "Completed")
    .not("deadline", "is", null)
    .gte("deadline", today)
    .order("deadline", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch upcoming deadlines:", error.message);
    return [];
  }

  return (data ?? []) as ProjectWithClient[];
}

export async function getRecentProjects(
  workspaceOwnerId: string,
  limit = 5,
): Promise<ProjectWithClient[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, name)")
    .eq("user_id", workspaceOwnerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch recent projects:", error.message);
    return [];
  }

  return (data ?? []) as ProjectWithClient[];
}

export async function getTasksDueToday(): Promise<TaskWithRelations[]> {
  const supabase = await createClient();
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "*, projects(id, name), assignee:profiles!tasks_assigned_user_fkey(id, full_name, email)",
    )
    .eq("due_date", today)
    .neq("status", "Done")
    .order("priority", { ascending: false });

  if (error) {
    console.error("Failed to fetch tasks due today:", error.message);
    return [];
  }

  return (data ?? []) as TaskWithRelations[];
}

export async function getRecentActivity(
  workspaceOwnerId: string,
  limit = 8,
): Promise<ActivityWithActor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, actor:profiles!activity_logs_user_id_fkey(full_name, email)")
    .eq("workspace_id", workspaceOwnerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch recent activity:", error.message);
    return [];
  }

  return (data ?? []) as ActivityWithActor[];
}
