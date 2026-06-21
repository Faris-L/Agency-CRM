import { safeSendEmail } from "@/lib/email/helpers";
import { sendEmail, type SendEmailResult } from "@/lib/email/send";
import { getInvoiceCreatedEmailContent } from "@/lib/email/templates/invoice-created";
import { getInvoiceOverdueEmailContent } from "@/lib/email/templates/invoice-overdue";
import { getProjectCompletedEmailContent } from "@/lib/email/templates/project-completed";
import { getTaskAssignedEmailContent } from "@/lib/email/templates/task-assigned";
import { getWelcomeEmailContent } from "@/lib/email/templates/welcome";

export { sendEmail, type SendEmailResult } from "@/lib/email/send";
export { getWelcomeEmailContent } from "@/lib/email/templates/welcome";
export { safeSendEmail } from "@/lib/email/helpers";

type SendWelcomeEmailInput = {
  to: string;
  fullName: string;
};

export async function sendWelcomeEmail({
  to,
  fullName,
}: SendWelcomeEmailInput): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { subject, html, text } = getWelcomeEmailContent({ fullName, appUrl });

  return sendEmail({ to, subject, html, text });
}

type SendTaskAssignedEmailInput = {
  to: string;
  assigneeName: string;
  taskTitle: string;
  projectName: string | null;
  dueDate: string | null;
  priority: string;
};

export async function sendTaskAssignedEmail(
  input: SendTaskAssignedEmailInput,
): Promise<SendEmailResult> {
  const { subject, html, text } = getTaskAssignedEmailContent(input);
  return sendEmail({ to: input.to, subject, html, text });
}

export async function notifyTaskAssigned(input: SendTaskAssignedEmailInput): Promise<void> {
  await safeSendEmail("task-assigned", () => sendTaskAssignedEmail(input));
}

type SendProjectCompletedEmailInput = {
  to: string;
  recipientName: string;
  projectName: string;
  clientName: string | null;
};

export async function sendProjectCompletedEmail(
  input: SendProjectCompletedEmailInput,
): Promise<SendEmailResult> {
  const { subject, html, text } = getProjectCompletedEmailContent(input);
  return sendEmail({ to: input.to, subject, html, text });
}

export async function notifyProjectCompleted(
  input: SendProjectCompletedEmailInput,
): Promise<void> {
  await safeSendEmail("project-completed", () => sendProjectCompletedEmail(input));
}

type SendInvoiceCreatedEmailInput = {
  to: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  projectName: string | null;
};

export async function sendInvoiceCreatedEmail(
  input: SendInvoiceCreatedEmailInput,
): Promise<SendEmailResult> {
  const { subject, html, text } = getInvoiceCreatedEmailContent(input);
  return sendEmail({ to: input.to, subject, html, text });
}

export async function notifyInvoiceCreated(input: SendInvoiceCreatedEmailInput): Promise<void> {
  await safeSendEmail("invoice-created", () => sendInvoiceCreatedEmail(input));
}

type SendInvoiceOverdueEmailInput = {
  to: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
};

export async function sendInvoiceOverdueEmail(
  input: SendInvoiceOverdueEmailInput,
): Promise<SendEmailResult> {
  const { subject, html, text } = getInvoiceOverdueEmailContent(input);
  return sendEmail({ to: input.to, subject, html, text });
}

export async function notifyInvoiceOverdue(input: SendInvoiceOverdueEmailInput): Promise<void> {
  await safeSendEmail("invoice-overdue", () => sendInvoiceOverdueEmail(input));
}

export async function sendTestEmail(to: string): Promise<SendEmailResult> {
  return sendWelcomeEmail({
    to,
    fullName: "Studioflow User",
  });
}
