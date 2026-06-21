import { notifyInvoiceOverdue } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

type OverdueInvoiceRow = {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  clients: { name: string; email: string | null } | null;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function syncOverdueInvoices(): Promise<void> {
  await syncOverdueInvoicesAndNotify();
}

export async function syncOverdueInvoicesAndNotify(): Promise<number> {
  const admin = createAdminClient();
  const today = todayIsoDate();

  const { data: pending, error } = await admin
    .from("invoices")
    .select("id, invoice_number, amount, due_date, clients(name, email)")
    .eq("status", "Pending")
    .lt("due_date", today);

  if (error) {
    console.error("Failed to fetch overdue invoices:", error.message);
    return 0;
  }

  const rows = (pending ?? []) as OverdueInvoiceRow[];

  for (const invoice of rows) {
    const clientEmail = invoice.clients?.email?.trim();
    if (!clientEmail) continue;

    await notifyInvoiceOverdue({
      to: clientEmail,
      clientName: invoice.clients?.name ?? "there",
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount,
      dueDate: invoice.due_date,
    });
  }

  const { error: rpcError } = await admin.rpc("mark_overdue_invoices");
  if (rpcError) {
    console.error("Failed to mark overdue invoices:", rpcError.message);
  }

  return rows.length;
}
