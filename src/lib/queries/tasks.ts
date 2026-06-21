import { createClient } from "@/lib/supabase/server";
import type { Profile, Project, Task } from "@/types";

export type TaskWithRelations = Task & {
  projects: Pick<Project, "id" | "name"> | null;
  assignee: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export type TaskListFilters = {
  q?: string;
  status?: string;
  priority?: string;
  projectId?: string;
};

export async function getTasks(filters: TaskListFilters = {}): Promise<TaskWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, projects(id, name), assignee:profiles!tasks_assigned_user_fkey(id, full_name, email)")
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as Task["status"]);
  }

  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority as Task["priority"]);
  }

  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters.q?.trim()) {
    query = query.ilike("title", `%${filters.q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch tasks:", error.message);
    return [];
  }

  return (data ?? []) as TaskWithRelations[];
}
