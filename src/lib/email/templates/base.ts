import { APP_NAME } from "@/lib/constants/app";

type EmailLayoutInput = {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

export { getAppUrl } from "@/lib/env/app-url";

export function wrapEmailLayout({
  title,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote = `You received this email from ${APP_NAME}.`,
}: EmailLayoutInput) {
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<p style="margin: 24px 0;">
          <a
            href="${ctaUrl}"
            style="background: #4f46e5; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;"
          >
            ${ctaLabel}
          </a>
        </p>`
      : "";

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto;">
      <h1 style="color: #4f46e5; margin-bottom: 8px;">${title}</h1>
      ${bodyHtml}
      ${ctaBlock}
      <p style="color: #6b7280; font-size: 14px;">
        ${footerNote}
      </p>
    </div>
  `.trim();

  return html;
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
