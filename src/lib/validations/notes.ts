import { z } from "zod";

export const noteFormSchema = z.object({
  clientId: z.string().uuid("Invalid client ID."),
  content: z
    .string()
    .trim()
    .min(1, "Note content is required.")
    .max(5000, "Note must be at most 5000 characters."),
});

export const noteIdSchema = z.object({
  id: z.string().uuid("Invalid note ID."),
});

export type NoteFormInput = z.infer<typeof noteFormSchema>;
export type NoteIdInput = z.infer<typeof noteIdSchema>;
