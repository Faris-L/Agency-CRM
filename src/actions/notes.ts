"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import {
  noteFormSchema,
  noteIdSchema,
  type NoteFormInput,
  type NoteIdInput,
} from "@/lib/validations/notes";
import type { ActionResult, Note } from "@/types";

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

export async function createNoteRecord(input: NoteFormInput): Promise<ActionResult<Note>> {
  const parsed = noteFormSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageClients");
  if (denied) return denied;

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", parsed.data.clientId)
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  if (!client) {
    return validationError("Client not found.");
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      client_id: parsed.data.clientId,
      user_id: ctx.userId,
      content: parsed.data.content.trim(),
    })
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to create note.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Note Created",
    entityType: "note",
    entityId: data.id,
  });

  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { success: true, data };
}

export async function deleteNoteRecord(input: NoteIdInput): Promise<ActionResult> {
  const parsed = noteIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid note ID.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageClients");
  if (denied) return denied;

  const supabase = await createClient();

  const { data: note } = await supabase
    .from("notes")
    .select("id, client_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!note) {
    return validationError("Note not found.");
  }

  const { error } = await supabase.from("notes").delete().eq("id", parsed.data.id);

  if (error) {
    return validationError(error.message);
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Note Deleted",
    entityType: "note",
    entityId: parsed.data.id,
  });

  revalidatePath(`/clients/${note.client_id}`);
  return { success: true };
}
