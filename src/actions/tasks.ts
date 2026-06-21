"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { notifyTaskAssigned } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeTaskInput,
  taskFormSchema,
  taskIdSchema,
  taskStatusSchema,
  type TaskFormInput,
  type TaskIdInput,
  type TaskStatusInput,
} from "@/lib/validations/tasks";
import type { ActionResult, Task } from "@/types";

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

async function maybeNotifyTaskAssigned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assignedUserId: string | null,
  task: Task,
) {
  if (!assignedUserId) return;

  const [{ data: assignee }, { data: project }] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", assignedUserId)
      .maybeSingle(),
    supabase.from("projects").select("name").eq("id", task.project_id).maybeSingle(),
  ]);

  if (!assignee?.email) return;

  await notifyTaskAssigned({
    to: assignee.email,
    assigneeName: assignee.full_name?.trim() || assignee.email,
    taskTitle: task.title,
    projectName: project?.name ?? null,
    dueDate: task.due_date,
    priority: task.priority,
  });
}

export async function createTaskRecord(input: TaskFormInput): Promise<ActionResult<Task>> {
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageTasks");
  if (denied) return denied;

  const supabase = await createClient();
  const payload = normalizeTaskInput(parsed.data);

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", payload.project_id)
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  if (!project) {
    return validationError("Project not found in your workspace.");
  }

  const { data, error } = await supabase.from("tasks").insert(payload).select().single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to create task.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Task Created",
    entityType: "task",
    entityId: data.id,
  });

  await maybeNotifyTaskAssigned(supabase, data.assigned_user, data);

  revalidatePath("/tasks");
  return { success: true, data };
}

export async function updateTaskRecord(
  input: TaskFormInput & TaskIdInput,
): Promise<ActionResult<Task>> {
  const idParsed = taskIdSchema.safeParse({ id: input.id });
  const formParsed = taskFormSchema.safeParse(input);

  if (!idParsed.success) {
    return validationError(idParsed.error.issues[0]?.message ?? "Invalid task ID.");
  }
  if (!formParsed.success) {
    return validationError(formParsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageTasks");
  if (denied) return denied;

  const supabase = await createClient();
  const payload = normalizeTaskInput(formParsed.data);

  const { data: existing } = await supabase
    .from("tasks")
    .select("status, project_id, assigned_user")
    .eq("id", idParsed.data.id)
    .maybeSingle();

  if (!existing) {
    return validationError("Task not found.");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", payload.project_id)
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  if (!project) {
    return validationError("Project not found in your workspace.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", idParsed.data.id)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to update task.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Task Updated",
    entityType: "task",
    entityId: data.id,
  });

  if (existing.status !== "Done" && data.status === "Done") {
    await logActivity(supabase, {
      userId: ctx.userId,
      workspaceId: ctx.workspaceOwnerId,
      action: "Task Completed",
      entityType: "task",
      entityId: data.id,
    });
  }

  if (payload.assigned_user && payload.assigned_user !== existing.assigned_user) {
    await maybeNotifyTaskAssigned(supabase, payload.assigned_user, data);
  }

  revalidatePath("/tasks");
  return { success: true, data };
}

export async function updateTaskStatus(input: TaskStatusInput): Promise<ActionResult<Task>> {
  const parsed = taskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tasks")
    .select("status, assigned_user, project_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!existing) {
    return validationError("Task not found.");
  }

  const canManage = ctx.permissions.manageTasks;
  const isAssignedMember =
    ctx.permissions.viewAssignedTasksOnly && existing.assigned_user === ctx.userId;

  if (!canManage && !isAssignedMember) {
    return validationError("You do not have permission to update this task.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to update task status.");
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Task Updated",
    entityType: "task",
    entityId: data.id,
  });

  if (existing.status !== "Done" && data.status === "Done") {
    await logActivity(supabase, {
      userId: ctx.userId,
      workspaceId: ctx.workspaceOwnerId,
      action: "Task Completed",
      entityType: "task",
      entityId: data.id,
    });
  }

  revalidatePath("/tasks");
  return { success: true, data };
}

export async function deleteTaskRecord(input: TaskIdInput): Promise<ActionResult> {
  const parsed = taskIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid task ID.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageTasks");
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", parsed.data.id);

  if (error) {
    return validationError(error.message);
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Task Deleted",
    entityType: "task",
    entityId: parsed.data.id,
  });

  revalidatePath("/tasks");
  return { success: true };
}
