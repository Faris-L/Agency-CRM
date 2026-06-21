import { z } from "zod";
import { PROJECT_STATUSES } from "@/lib/constants/app";

export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(200, "Name must be at most 200 characters."),
  client_id: z.uuid("Select a client."),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be at most 5000 characters."),
  budget: z
    .string()
    .refine((val) => val === "" || !Number.isNaN(Number(val)), {
      message: "Budget must be a valid number.",
    })
    .refine((val) => val === "" || Number(val) >= 0, {
      message: "Budget must be zero or greater.",
    }),
  deadline: z.string(),
  status: z.enum(PROJECT_STATUSES),
});

export const projectIdSchema = z.object({
  id: z.uuid("Invalid project ID."),
});

export const projectStatusSchema = z.object({
  id: z.uuid("Invalid project ID."),
  status: z.enum(PROJECT_STATUSES),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type ProjectStatusInput = z.infer<typeof projectStatusSchema>;

export function normalizeProjectInput(input: ProjectFormInput) {
  const budget = input.budget.trim() === "" ? null : Number(input.budget);

  return {
    name: input.name.trim(),
    client_id: input.client_id,
    description: input.description.trim() || null,
    budget,
    deadline: input.deadline.trim() || null,
    status: input.status,
  };
}
