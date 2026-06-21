import { APP_NAME } from "@/lib/constants/app";
import { getAppUrl, stripHtml, wrapEmailLayout } from "@/lib/email/templates/base";

type ProjectCompletedEmailContent = {
  recipientName: string;
  projectName: string;
  clientName: string | null;
};

export function getProjectCompletedEmailContent({
  recipientName,
  projectName,
  clientName,
}: ProjectCompletedEmailContent) {
  const name = recipientName.trim() || "there";
  const appUrl = getAppUrl();
  const subject = `Project completed: ${projectName}`;

  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>Great news — a project in your ${APP_NAME} workspace has been marked as completed.</p>
    <ul style="padding-left: 20px;">
      <li><strong>Project:</strong> ${projectName}</li>
      <li><strong>Client:</strong> ${clientName ?? "—"}</li>
    </ul>
  `.trim();

  const html = wrapEmailLayout({
    title: "Project completed",
    bodyHtml,
    ctaLabel: "View projects",
    ctaUrl: `${appUrl}/projects`,
  });

  const text = stripHtml(
    `Hi ${name}, project "${projectName}" was completed. View projects: ${appUrl}/projects`,
  );

  return { subject, html, text };
}
