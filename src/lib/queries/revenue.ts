import { createClient } from "@/lib/supabase/server";
import {
  getMostProfitableClients,
  getRevenueByMonth,
  type ProfitableClient,
  type RevenueMonth,
} from "@/lib/queries/dashboard";

export type RevenueStats = {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingRevenue: number;
  paidInvoiceCount: number;
};

export type RevenuePageData = {
  stats: RevenueStats;
  revenueByMonth: RevenueMonth[];
  profitableClients: ProfitableClient[];
};

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getRevenueStats(workspaceOwnerId: string): Promise<RevenueStats> {
  const supabase = await createClient();
  const monthStart = getMonthStart().toISOString();

  const [paidRes, monthlyRes, pendingRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("amount", { count: "exact" })
      .eq("user_id", workspaceOwnerId)
      .eq("status", "Paid"),
    supabase
      .from("invoices")
      .select("amount")
      .eq("user_id", workspaceOwnerId)
      .eq("status", "Paid")
      .gte("created_at", monthStart),
    supabase
      .from("invoices")
      .select("amount")
      .eq("user_id", workspaceOwnerId)
      .in("status", ["Pending", "Overdue"]),
  ]);

  const totalRevenue = (paidRes.data ?? []).reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );

  const monthlyRevenue = (monthlyRes.data ?? []).reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );

  const pendingRevenue = (pendingRes.data ?? []).reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );

  return {
    totalRevenue,
    monthlyRevenue,
    pendingRevenue,
    paidInvoiceCount: paidRes.count ?? 0,
  };
}

export async function getRevenuePageData(workspaceOwnerId: string): Promise<RevenuePageData> {
  const [stats, revenueByMonth, profitableClients] = await Promise.all([
    getRevenueStats(workspaceOwnerId),
    getRevenueByMonth(workspaceOwnerId),
    getMostProfitableClients(workspaceOwnerId),
  ]);

  return { stats, revenueByMonth, profitableClients };
}
