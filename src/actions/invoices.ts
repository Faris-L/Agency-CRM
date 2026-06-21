"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { notifyInvoiceCreated, notifyInvoiceOverdue } from "@/lib/email";
import { getNextInvoiceNumber } from "@/lib/queries/invoices";
import { createClient } from "@/lib/supabase/server";
import {
  invoiceFormSchema,
  invoiceIdSchema,
  normalizeInvoiceInput,
  type InvoiceFormInput,
  type InvoiceIdInput,
} from "@/lib/validations/invoices";
import type { ActionResult, Invoice } from "@/types";

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

const REVALIDATE_PATHS = ["/invoices", "/revenue", "/dashboard"] as const;

function revalidateInvoicePaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function createInvoiceRecord(
  input: InvoiceFormInput,
): Promise<ActionResult<Invoice>> {
  const parsed = invoiceFormSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageInvoices");
  if (denied) return denied;

  const supabase = await createClient();
  const payload = normalizeInvoiceInput(parsed.data);

  if (payload.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", payload.project_id)
      .eq("user_id", ctx.workspaceOwnerId)
      .maybeSingle();

    if (!project) {
      return validationError("Selected project not found.");
    }

    if (project.client_id !== payload.client_id) {
      return validationError("Project must belong to the selected client.");
    }
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...payload, user_id: ctx.workspaceOwnerId })
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to create invoice.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Invoice Created",
    entityType: "invoice",
    entityId: data.id,
  });

  const [{ data: client }, { data: project }] = await Promise.all([
    supabase.from("clients").select("name, email").eq("id", data.client_id).maybeSingle(),
    data.project_id
      ? supabase.from("projects").select("name").eq("id", data.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (client?.email?.trim()) {
    await notifyInvoiceCreated({
      to: client.email.trim(),
      clientName: client.name,
      invoiceNumber: data.invoice_number,
      amount: data.amount,
      dueDate: data.due_date,
      projectName: project?.name ?? null,
    });
  }

  revalidateInvoicePaths();
  return { success: true, data };
}

export async function updateInvoiceRecord(
  input: InvoiceFormInput & InvoiceIdInput,
): Promise<ActionResult<Invoice>> {
  const idParsed = invoiceIdSchema.safeParse({ id: input.id });
  const formParsed = invoiceFormSchema.safeParse(input);

  if (!idParsed.success) {
    return validationError(idParsed.error.issues[0]?.message ?? "Invalid invoice ID.");
  }
  if (!formParsed.success) {
    return validationError(formParsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageInvoices");
  if (denied) return denied;

  const supabase = await createClient();
  const payload = normalizeInvoiceInput(formParsed.data);

  if (payload.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", payload.project_id)
      .eq("user_id", ctx.workspaceOwnerId)
      .maybeSingle();

    if (!project) {
      return validationError("Selected project not found.");
    }

    if (project.client_id !== payload.client_id) {
      return validationError("Project must belong to the selected client.");
    }
  }

  const { data: existing } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", idParsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  if (!existing) {
    return validationError("Invoice not found.");
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", idParsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to update invoice.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Invoice Updated",
    entityType: "invoice",
    entityId: data.id,
  });

  if (existing.status !== "Paid" && data.status === "Paid") {
    await logActivity(supabase, {
      userId: ctx.userId,
      workspaceId: ctx.workspaceOwnerId,
      action: "Invoice Paid",
      entityType: "invoice",
      entityId: data.id,
    });
  }

  if (existing.status !== "Overdue" && data.status === "Overdue") {
    const { data: client } = await supabase
      .from("clients")
      .select("name, email")
      .eq("id", data.client_id)
      .maybeSingle();

    if (client?.email?.trim()) {
      await notifyInvoiceOverdue({
        to: client.email.trim(),
        clientName: client.name,
        invoiceNumber: data.invoice_number,
        amount: data.amount,
        dueDate: data.due_date,
      });
    }
  }

  revalidateInvoicePaths();
  return { success: true, data };
}

export async function deleteInvoiceRecord(input: InvoiceIdInput): Promise<ActionResult> {
  const parsed = invoiceIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid invoice ID.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageInvoices");
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId);

  if (error) {
    return validationError(error.message);
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Invoice Deleted",
    entityType: "invoice",
    entityId: parsed.data.id,
  });

  revalidateInvoicePaths();
  return { success: true };
}

export async function getSuggestedInvoiceNumber(): Promise<ActionResult<string>> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageInvoices");
  if (denied) return denied;

  const number = await getNextInvoiceNumber(ctx.workspaceOwnerId);
  return { success: true, data: number };
}
