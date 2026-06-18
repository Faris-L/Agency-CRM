import { getFromEmail, getResendClient } from "@/lib/email/client";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const from = getFromEmail();

    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.id) {
      return { success: false, error: "Email sent but no message ID returned." };
    }

    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return { success: false, error: message };
  }
}
