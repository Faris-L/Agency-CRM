import { APP_NAME } from "@/lib/constants/app";

type WelcomeEmailContent = {
  fullName: string;
  appUrl: string;
};

export function getWelcomeEmailContent({ fullName, appUrl }: WelcomeEmailContent) {
  const name = fullName.trim() || "there";

  const subject = `Welcome to ${APP_NAME}!`;

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto;">
      <h1 style="color: #4f46e5; margin-bottom: 8px;">Welcome to ${APP_NAME}</h1>
      <p>Hi ${name},</p>
      <p>
        Your account is ready. You can now manage clients, projects, tasks, and invoices
        from one dashboard.
      </p>
      <p style="margin: 24px 0;">
        <a
          href="${appUrl}/dashboard"
          style="background: #4f46e5; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;"
        >
          Go to dashboard
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        If you did not create this account, you can ignore this email.
      </p>
    </div>
  `.trim();

  const text = [
    `Welcome to ${APP_NAME}!`,
    ``,
    `Hi ${name},`,
    ``,
    `Your account is ready. Open your dashboard: ${appUrl}/dashboard`,
  ].join("\n");

  return { subject, html, text };
}
