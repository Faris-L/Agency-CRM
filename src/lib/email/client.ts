import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function getFromEmail() {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("Missing RESEND_FROM_EMAIL environment variable.");
  }

  return from;
}
