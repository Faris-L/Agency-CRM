import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants/app";

const optionalUuid = z
  .string()
  .refine((val) => val === "" || z.uuid().safeParse(val).success, {
    message: "Invalid assignee.",
  });

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(200, "Title must be at most 200 characters."),
  project_id: z.uuid("Select a project."),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be at most 5000 characters."),
  due_date: z.string(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  assigned_user: optionalUuid,
});

export const taskIdSchema = z.object({
  id: z.uuid("Invalid task ID."),
});

export const taskStatusSchema = z.object({
  id: z.uuid("Invalid task ID."),
  status: z.enum(TASK_STATUSES),
});

export type TaskFormInput = z.infer<typeof taskFormSchema>;
export type TaskIdInput = z.infer<typeof taskIdSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;

export function normalizeTaskInput(input: TaskFormInput) {
  return {
    title: input.title.trim(),
    project_id: input.project_id,
    description: input.description.trim() || null,
    due_date: input.due_date.trim() || null,
    priority: input.priority,
    status: input.status,
    assigned_user: input.assigned_user.trim() || null,
  };
}
