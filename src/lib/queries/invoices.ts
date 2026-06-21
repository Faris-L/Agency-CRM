import { syncOverdueInvoices } from "@/lib/invoices/sync-overdue";
import { createClient } from "@/lib/supabase/server";
import type { Client, Invoice, Project } from "@/types";

export type InvoiceWithRelations = Invoice & {
  clients: Pick<Client, "id" | "name" | "company" | "email"> | null;
  projects: Pick<Project, "id" | "name"> | null;
};

export type InvoiceListFilters = {
  q?: string;
  status?: string;
  clientId?: string;
};

export async function getInvoices(
  filters: InvoiceListFilters = {},
): Promise<InvoiceWithRelations[]> {
  const supabase = await createClient();
  await syncOverdueInvoices();

  let query = supabase
    .from("invoices")
    .select("*, clients(id, name, company, email), projects(id, name)")
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as Invoice["status"]);
  }

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.q?.trim()) {
    query = query.ilike("invoice_number", `%${filters.q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch invoices:", error.message);
    return [];
  }

  return (data ?? []) as InvoiceWithRelations[];
}

export async function getInvoiceById(id: string): Promise<InvoiceWithRelations | null> {
  const supabase = await createClient();
  await syncOverdueInvoices();

  const { data, error } = await supabase
    .from("invoices")
    .select("*, clients(id, name, company, email), projects(id, name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch invoice:", error.message);
    return null;
  }

  return data as InvoiceWithRelations | null;
}

export async function getNextInvoiceNumber(workspaceOwnerId: string): Promise<string> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", workspaceOwnerId);

  const next = 1001 + (count ?? 0);
  return `INV-${String(next).padStart(4, "0")}`;
}
