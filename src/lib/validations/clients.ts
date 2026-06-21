import { z } from "zod";
import { CLIENT_STATUSES } from "@/lib/constants/app";

const optionalEmail = z
  .string()
  .trim()
  .refine((val) => val === "" || z.email().safeParse(val).success, {
    message: "Enter a valid email address.",
  });

export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required.")
    .max(200, "Name must be at most 200 characters."),
  company: z.string().trim().max(200, "Company must be at most 200 characters."),
  email: optionalEmail,
  phone: z.string().trim().max(50, "Phone must be at most 50 characters."),
  status: z.enum(CLIENT_STATUSES),
  notes: z.string().trim().max(5000, "Notes must be at most 5000 characters."),
});

export const clientIdSchema = z.object({
  id: z.uuid("Invalid client ID."),
});

export type ClientFormInput = z.infer<typeof clientFormSchema>;
export type ClientIdInput = z.infer<typeof clientIdSchema>;

export function normalizeClientInput(input: ClientFormInput) {
  return {
    name: input.name.trim(),
    company: input.company.trim() || null,
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
    status: input.status,
    notes: input.notes.trim() || null,
  };
}
