"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_CLIENT_FILE_TYPES,
  CLIENT_FILE_MAX_BYTES,
  clientFileIdSchema,
  clientFileUploadSchema,
  type ClientFileIdInput,
} from "@/lib/validations/client-files";
import type { ActionResult, ClientFile } from "@/types";

const CLIENT_FILES_BUCKET = "client-files";

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadClientFile(formData: FormData): Promise<ActionResult<ClientFile>> {
  const clientId = formData.get("clientId");
  const file = formData.get("file");

  const parsed = clientFileUploadSchema.safeParse({ clientId });
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  if (!(file instanceof File) || file.size === 0) {
    return validationError("Please select a file to upload.");
  }

  if (file.size > CLIENT_FILE_MAX_BYTES) {
    return validationError("File must be 10 MB or smaller.");
  }

  if (!ALLOWED_CLIENT_FILE_TYPES.includes(file.type as (typeof ALLOWED_CLIENT_FILE_TYPES)[number])) {
    return validationError("File type is not supported.");
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

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${ctx.workspaceOwnerId}/${parsed.data.clientId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(CLIENT_FILES_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return validationError(uploadError.message);
  }

  const { data, error } = await supabase
    .from("client_files")
    .insert({
      client_id: parsed.data.clientId,
      user_id: ctx.userId,
      file_name: file.name,
      file_url: storagePath,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single();

  if (error || !data) {
    await supabase.storage.from(CLIENT_FILES_BUCKET).remove([storagePath]);
    return validationError(error?.message ?? "Failed to save file metadata.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Client File Uploaded",
    entityType: "client_file",
    entityId: data.id,
  });

  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { success: true, data };
}

export async function deleteClientFileRecord(input: ClientFileIdInput): Promise<ActionResult> {
  const parsed = clientFileIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid file ID.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageClients");
  if (denied) return denied;

  const supabase = await createClient();

  const { data: fileRecord } = await supabase
    .from("client_files")
    .select("id, client_id, file_url")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!fileRecord) {
    return validationError("File not found.");
  }

  const { data: clientCheck } = await supabase
    .from("clients")
    .select("id")
    .eq("id", fileRecord.client_id)
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  if (!clientCheck) {
    return validationError("File not found.");
  }

  await supabase.storage.from(CLIENT_FILES_BUCKET).remove([fileRecord.file_url]);

  const { error } = await supabase.from("client_files").delete().eq("id", parsed.data.id);

  if (error) {
    return validationError(error.message);
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Client File Deleted",
    entityType: "client_file",
    entityId: parsed.data.id,
  });

  revalidatePath(`/clients/${fileRecord.client_id}`);
  return { success: true };
}

export async function getClientFileDownloadUrl(
  input: ClientFileIdInput,
): Promise<ActionResult<string>> {
  const parsed = clientFileIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid file ID.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const supabase = await createClient();

  const { data: fileRecord } = await supabase
    .from("client_files")
    .select("id, file_url, file_name, client_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!fileRecord) {
    return validationError("File not found.");
  }

  const { data: clientCheck } = await supabase
    .from("clients")
    .select("id")
    .eq("id", fileRecord.client_id)
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  if (!clientCheck) {
    return validationError("File not found.");
  }

  const { data, error } = await supabase.storage
    .from(CLIENT_FILES_BUCKET)
    .createSignedUrl(fileRecord.file_url, 60, {
      download: fileRecord.file_name,
    });

  if (error || !data?.signedUrl) {
    return validationError(error?.message ?? "Failed to generate download link.");
  }

  return { success: true, data: data.signedUrl };
}
