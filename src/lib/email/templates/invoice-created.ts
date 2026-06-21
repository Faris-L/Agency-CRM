import { CURRENCY_SYMBOL } from "@/lib/constants/app";
import { getAppUrl, stripHtml, wrapEmailLayout } from "@/lib/email/templates/base";

type InvoiceCreatedEmailContent = {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  projectName: string | null;
};

function formatMoney(amount: number) {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDueDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getInvoiceCreatedEmailContent({
  clientName,
  invoiceNumber,
  amount,
  dueDate,
  projectName,
}: InvoiceCreatedEmailContent) {
  const name = clientName.trim() || "there";
  const appUrl = getAppUrl();
  const subject = `Invoice ${invoiceNumber} from Studioflow`;

  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>A new invoice has been issued for your account.</p>
    <ul style="padding-left: 20px;">
      <li><strong>Invoice #:</strong> ${invoiceNumber}</li>
      <li><strong>Amount:</strong> ${formatMoney(amount)}</li>
      <li><strong>Due date:</strong> ${formatDueDate(dueDate)}</li>
      <li><strong>Project:</strong> ${projectName ?? "—"}</li>
    </ul>
  `.trim();

  const html = wrapEmailLayout({
    title: "New invoice",
    bodyHtml,
    footerNote: "If you have questions about this invoice, please contact your account manager.",
  });

  const text = stripHtml(
    `Hi ${name}, invoice ${invoiceNumber} for ${formatMoney(amount)} is due ${formatDueDate(dueDate)}.`,
  );

  return { subject, html, text };
}
