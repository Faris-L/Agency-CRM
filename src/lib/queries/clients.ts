import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types";

export type ClientListFilters = {
  q?: string;
  status?: string;
};

export async function getClients(filters: ClientListFilters = {}): Promise<Client[]> {
  const supabase = await createClient();
  let query = supabase.from("clients").select("*").order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as Client["status"]);
  }

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`name.ilike.${term},company.ilike.${term},email.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch clients:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getClientCount(workspaceOwnerId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", workspaceOwnerId);

  return count ?? 0;
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("Failed to fetch client:", error.message);
    return null;
  }

  return data;
}
