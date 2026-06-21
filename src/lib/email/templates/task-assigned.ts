import { APP_NAME } from "@/lib/constants/app";
import { getAppUrl, stripHtml, wrapEmailLayout } from "@/lib/email/templates/base";

type TaskAssignedEmailContent = {
  assigneeName: string;
  taskTitle: string;
  projectName: string | null;
  dueDate: string | null;
  priority: string;
};

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getTaskAssignedEmailContent({
  assigneeName,
  taskTitle,
  projectName,
  dueDate,
  priority,
}: TaskAssignedEmailContent) {
  const name = assigneeName.trim() || "there";
  const appUrl = getAppUrl();
  const subject = `New task assigned: ${taskTitle}`;

  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>A new task has been assigned to you in ${APP_NAME}.</p>
    <ul style="padding-left: 20px;">
      <li><strong>Task:</strong> ${taskTitle}</li>
      <li><strong>Project:</strong> ${projectName ?? "—"}</li>
      <li><strong>Priority:</strong> ${priority}</li>
      <li><strong>Due date:</strong> ${formatDueDate(dueDate)}</li>
    </ul>
  `.trim();

  const html = wrapEmailLayout({
    title: "Task assigned",
    bodyHtml,
    ctaLabel: "View tasks",
    ctaUrl: `${appUrl}/tasks`,
  });

  const text = stripHtml(
    `Hi ${name}, a new task "${taskTitle}" was assigned to you. View tasks: ${appUrl}/tasks`,
  );

  return { subject, html, text };
}
