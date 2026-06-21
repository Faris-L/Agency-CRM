import { CURRENCY_SYMBOL } from "@/lib/constants/app";
import { getAppUrl, stripHtml, wrapEmailLayout } from "@/lib/email/templates/base";

type InvoiceOverdueEmailContent = {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
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

export function getInvoiceOverdueEmailContent({
  clientName,
  invoiceNumber,
  amount,
  dueDate,
}: InvoiceOverdueEmailContent) {
  const name = clientName.trim() || "there";
  const appUrl = getAppUrl();
  const subject = `Overdue invoice: ${invoiceNumber}`;

  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>This is a reminder that the following invoice is now overdue.</p>
    <ul style="padding-left: 20px;">
      <li><strong>Invoice #:</strong> ${invoiceNumber}</li>
      <li><strong>Amount:</strong> ${formatMoney(amount)}</li>
      <li><strong>Original due date:</strong> ${formatDueDate(dueDate)}</li>
    </ul>
    <p>Please arrange payment at your earliest convenience.</p>
  `.trim();

  const html = wrapEmailLayout({
    title: "Invoice overdue",
    bodyHtml,
    footerNote: "If you have already paid, please disregard this message.",
  });

  const text = stripHtml(
    `Hi ${name}, invoice ${invoiceNumber} for ${formatMoney(amount)} was due ${formatDueDate(dueDate)} and is now overdue.`,
  );

  return { subject, html, text };
}
