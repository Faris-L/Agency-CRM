import { createClient } from "@/lib/supabase/server";
import type { Client, Project } from "@/types";

export type ProjectWithClient = Project & {
  clients: Pick<Client, "id" | "name"> | null;
};

export type ProjectListFilters = {
  q?: string;
  status?: string;
  clientId?: string;
};

export async function getProjects(
  filters: ProjectListFilters = {},
): Promise<ProjectWithClient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*, clients(id, name)")
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as Project["status"]);
  }

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.q?.trim()) {
    query = query.ilike("name", `%${filters.q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch projects:", error.message);
    return [];
  }

  return (data ?? []) as ProjectWithClient[];
}

export async function getProjectCount(workspaceOwnerId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", workspaceOwnerId);

  return count ?? 0;
}
