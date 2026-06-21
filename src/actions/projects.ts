"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { notifyProjectCompleted } from "@/lib/email";
import { checkProjectLimit } from "@/lib/plans/check-limits";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeProjectInput,
  projectFormSchema,
  projectIdSchema,
  projectStatusSchema,
  type ProjectFormInput,
  type ProjectIdInput,
  type ProjectStatusInput,
} from "@/lib/validations/projects";
import type { ActionResult, Project } from "@/types";

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

async function maybeNotifyProjectCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceOwnerId: string,
  project: Project,
) {
  const [{ data: owner }, { data: client }] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", workspaceOwnerId)
      .maybeSingle(),
    supabase.from("clients").select("name").eq("id", project.client_id).maybeSingle(),
  ]);

  if (!owner?.email) return;

  await notifyProjectCompleted({
    to: owner.email,
    recipientName: owner.full_name?.trim() || owner.email,
    projectName: project.name,
    clientName: client?.name ?? null,
  });
}

export async function createProjectRecord(
  input: ProjectFormInput,
): Promise<ActionResult<Project>> {
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageProjects");
  if (denied) return denied;

  const supabase = await createClient();
  const limitCheck = await checkProjectLimit(supabase, ctx.workspaceOwnerId, ctx.plan);
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.error };
  }

  const payload = normalizeProjectInput(parsed.data);
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...payload, user_id: ctx.workspaceOwnerId })
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to create project.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Project Created",
    entityType: "project",
    entityId: data.id,
  });

  revalidatePath("/projects");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateProjectRecord(
  input: ProjectFormInput & ProjectIdInput,
): Promise<ActionResult<Project>> {
  const idParsed = projectIdSchema.safeParse({ id: input.id });
  const formParsed = projectFormSchema.safeParse(input);

  if (!idParsed.success) {
    return validationError(idParsed.error.issues[0]?.message ?? "Invalid project ID.");
  }
  if (!formParsed.success) {
    return validationError(formParsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageProjects");
  if (denied) return denied;

  const supabase = await createClient();
  const payload = normalizeProjectInput(formParsed.data);

  const { data: existing } = await supabase
    .from("projects")
    .select("status")
    .eq("id", idParsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", idParsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to update project.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Project Updated",
    entityType: "project",
    entityId: data.id,
  });

  if (existing?.status !== "Completed" && data.status === "Completed") {
    await logActivity(supabase, {
      userId: ctx.userId,
      workspaceId: ctx.workspaceOwnerId,
      action: "Project Completed",
      entityType: "project",
      entityId: data.id,
    });
    await maybeNotifyProjectCompleted(supabase, ctx.workspaceOwnerId, data);
  }

  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateProjectStatus(
  input: ProjectStatusInput,
): Promise<ActionResult<Project>> {
  const parsed = projectStatusSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageProjects");
  if (denied) return denied;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("projects")
    .select("status")
    .eq("id", parsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  if (!existing) {
    return validationError("Project not found.");
  }

  if (existing.status === parsed.data.status) {
    const { data: current } = await supabase
      .from("projects")
      .select("*")
      .eq("id", parsed.data.id)
      .single();
    return current ? { success: true, data: current } : validationError("Project not found.");
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to update project status.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Project Updated",
    entityType: "project",
    entityId: data.id,
  });

  if (existing.status !== "Completed" && data.status === "Completed") {
    await logActivity(supabase, {
      userId: ctx.userId,
      workspaceId: ctx.workspaceOwnerId,
      action: "Project Completed",
      entityType: "project",
      entityId: data.id,
    });
    await maybeNotifyProjectCompleted(supabase, ctx.workspaceOwnerId, data);
  }

  revalidatePath("/projects");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function deleteProjectRecord(input: ProjectIdInput): Promise<ActionResult> {
  const parsed = projectIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid project ID.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageProjects");
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", ctx.workspaceOwnerId);

  if (error) {
    return validationError(error.message);
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Project Deleted",
    entityType: "project",
    entityId: parsed.data.id,
  });

  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { success: true };
}
