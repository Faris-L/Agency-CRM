"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { checkClientLimit } from "@/lib/plans/check-limits";
import { createClient } from "@/lib/supabase/server";
import {
  clientFormSchema,
  clientIdSchema,
  normalizeClientInput,
  type ClientFormInput,
  type ClientIdInput,
} from "@/lib/validations/clients";
import type { ActionResult, Client } from "@/types";

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

export async function createClientRecord(
  input: ClientFormInput,
): Promise<ActionResult<Client>> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageClients");
  if (denied) return denied;

  const supabase = await createClient();
  const limitCheck = await checkClientLimit(supabase, ctx.workspaceOwnerId, ctx.plan);
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.error };
  }

  const payload = normalizeClientInput(parsed.data);
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...payload, user_id: ctx.workspaceOwnerId })
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to create client.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Client Created",
    entityType: "client",
    entityId: data.id,
  });

  revalidatePath("/clients");
  return { success: true, data };
}

export async function updateClientRecord(
  input: ClientFormInput & ClientIdInput,
): Promise<ActionResult<Client>> {
  const idParsed = clientIdSchema.safeParse({ id: input.id });
  const formParsed = clientFormSchema.safeParse(input);

  if (!idParsed.success) {
    return validationError(idParsed.error.issues[0]?.message ?? "Invalid client ID.");
  }
  if (!formParsed.success) {
    return validationError(formParsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageClients");
  if (denied) return denied;

  const supabase = await createClient();
  const payload = normalizeClientInput(formParsed.data);

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", idParsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to update client.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Client Updated",
    entityType: "client",
    entityId: data.id,
  });

  revalidatePath("/clients");
  return { success: true, data };
}

export async function deleteClientRecord(input: ClientIdInput): Promise<ActionResult> {
  const parsed = clientIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid client ID.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageClients");
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId);

  if (error) {
    return validationError(error.message);
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Client Deleted",
    entityType: "client",
    entityId: parsed.data.id,
  });

  revalidatePath("/clients");
  revalidatePath("/projects");
  return { success: true };
}
