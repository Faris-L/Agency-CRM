import { z } from "zod";
import { INVOICE_STATUSES } from "@/lib/constants/app";

export const invoiceFormSchema = z.object({
  client_id: z.uuid("Select a client."),
  project_id: z.string(),
  invoice_number: z
    .string()
    .trim()
    .min(1, "Invoice number is required.")
    .max(50, "Invoice number must be at most 50 characters."),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .refine((val) => !Number.isNaN(Number(val)), {
      message: "Amount must be a valid number.",
    })
    .refine((val) => Number(val) >= 0, {
      message: "Amount must be zero or greater.",
    }),
  due_date: z
    .string()
    .trim()
    .min(1, "Due date is required."),
  status: z.enum(INVOICE_STATUSES),
});

export const invoiceIdSchema = z.object({
  id: z.uuid("Invalid invoice ID."),
});

export type InvoiceFormInput = z.infer<typeof invoiceFormSchema>;
export type InvoiceIdInput = z.infer<typeof invoiceIdSchema>;

export function normalizeInvoiceInput(input: InvoiceFormInput) {
  return {
    client_id: input.client_id,
    project_id: input.project_id.trim() === "" ? null : input.project_id,
    invoice_number: input.invoice_number.trim(),
    amount: Number(input.amount),
    due_date: input.due_date.trim(),
    status: input.status,
  };
}
