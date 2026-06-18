import { sendEmail, type SendEmailResult } from "@/lib/email/send";
import { getWelcomeEmailContent } from "@/lib/email/templates/welcome";

export { sendEmail, type SendEmailResult } from "@/lib/email/send";
export { getWelcomeEmailContent } from "@/lib/email/templates/welcome";

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

export async function sendTestEmail(to: string): Promise<SendEmailResult> {
  return sendWelcomeEmail({
    to,
    fullName: "Studioflow User",
  });
}
