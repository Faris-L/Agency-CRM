import type { SendEmailResult } from "@/lib/email/send";

export async function safeSendEmail(
  label: string,
  send: () => Promise<SendEmailResult>,
): Promise<void> {
  try {
    const result = await send();
    if (!result.success) {
      console.error(`[email] ${label} failed:`, result.error);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[email] ${label} threw:`, message);
  }
}
