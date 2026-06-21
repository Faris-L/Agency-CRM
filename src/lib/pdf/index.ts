import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { APP_NAME, CURRENCY } from "@/lib/constants/app";
import type { InvoiceWithRelations } from "@/lib/queries/invoices";

const BRAND_COLOR = rgb(0.39, 0.2, 0.85);
const TEXT_COLOR = rgb(0.15, 0.15, 0.18);
const MUTED_COLOR = rgb(0.45, 0.45, 0.5);

export type InvoicePdfData = {
  invoice: InvoiceWithRelations;
  ownerName: string;
  ownerEmail: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const { invoice, ownerName, ownerEmail } = data;
  const client = invoice.clients;
  const project = invoice.projects;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  page.drawRectangle({
    x: 0,
    y: height - 80,
    width,
    height: 80,
    color: BRAND_COLOR,
  });

  page.drawText(APP_NAME, {
    x: margin,
    y: height - 52,
    size: 22,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText("INVOICE", {
    x: width - margin - 100,
    y: height - 52,
    size: 22,
    font: bold,
    color: rgb(1, 1, 1),
  });

  y = height - 120;

  page.drawText("From", {
    x: margin,
    y,
    size: 10,
    font: bold,
    color: MUTED_COLOR,
  });
  y -= 16;
  page.drawText(ownerName || APP_NAME, {
    x: margin,
    y,
    size: 12,
    font: bold,
    color: TEXT_COLOR,
  });
  y -= 14;
  page.drawText(ownerEmail, {
    x: margin,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR,
  });

  const rightCol = width - margin - 180;
  let rightY = height - 120;

  page.drawText("Invoice Number", {
    x: rightCol,
    y: rightY,
    size: 10,
    font: bold,
    color: MUTED_COLOR,
  });
  rightY -= 16;
  page.drawText(invoice.invoice_number, {
    x: rightCol,
    y: rightY,
    size: 12,
    font: bold,
    color: TEXT_COLOR,
  });
  rightY -= 24;

  page.drawText("Issue Date", {
    x: rightCol,
    y: rightY,
    size: 10,
    font: bold,
    color: MUTED_COLOR,
  });
  rightY -= 16;
  page.drawText(formatDate(invoice.created_at), {
    x: rightCol,
    y: rightY,
    size: 10,
    font: regular,
    color: TEXT_COLOR,
  });
  rightY -= 24;

  page.drawText("Due Date", {
    x: rightCol,
    y: rightY,
    size: 10,
    font: bold,
    color: MUTED_COLOR,
  });
  rightY -= 16;
  page.drawText(formatDate(invoice.due_date), {
    x: rightCol,
    y: rightY,
    size: 10,
    font: regular,
    color: TEXT_COLOR,
  });
  rightY -= 24;

  page.drawText("Status", {
    x: rightCol,
    y: rightY,
    size: 10,
    font: bold,
    color: MUTED_COLOR,
  });
  rightY -= 16;
  page.drawText(invoice.status, {
    x: rightCol,
    y: rightY,
    size: 10,
    font: bold,
    color: invoice.status === "Overdue" ? rgb(0.85, 0.2, 0.2) : TEXT_COLOR,
  });

  y -= 50;

  page.drawText("Bill To", {
    x: margin,
    y,
    size: 10,
    font: bold,
    color: MUTED_COLOR,
  });
  y -= 16;
  page.drawText(client?.name ?? "—", {
    x: margin,
    y,
    size: 12,
    font: bold,
    color: TEXT_COLOR,
  });
  y -= 14;

  if (client?.company) {
    page.drawText(client.company, {
      x: margin,
      y,
      size: 10,
      font: regular,
      color: TEXT_COLOR,
    });
    y -= 14;
  }

  if (client?.email) {
    page.drawText(client.email, {
      x: margin,
      y,
      size: 10,
      font: regular,
      color: TEXT_COLOR,
    });
    y -= 14;
  }

  y -= 30;

  const tableTop = y;
  const tableWidth = width - margin * 2;

  page.drawRectangle({
    x: margin,
    y: tableTop - 24,
    width: tableWidth,
    height: 24,
    color: rgb(0.95, 0.94, 0.98),
  });

  page.drawText("Description", {
    x: margin + 12,
    y: tableTop - 16,
    size: 10,
    font: bold,
    color: TEXT_COLOR,
  });
  page.drawText("Amount", {
    x: width - margin - 80,
    y: tableTop - 16,
    size: 10,
    font: bold,
    color: TEXT_COLOR,
  });

  y = tableTop - 48;

  const description = project?.name
    ? `Services — ${project.name}`
    : "Professional services";

  page.drawText(description, {
    x: margin + 12,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR,
  });

  page.drawText(formatCurrency(Number(invoice.amount)), {
    x: width - margin - 80,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR,
  });

  y -= 40;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.88, 0.88, 0.9),
  });

  y -= 30;

  page.drawText("Total Due", {
    x: width - margin - 160,
    y,
    size: 12,
    font: bold,
    color: MUTED_COLOR,
  });
  page.drawText(formatCurrency(Number(invoice.amount)), {
    x: width - margin - 80,
    y,
    size: 14,
    font: bold,
    color: BRAND_COLOR,
  });

  page.drawText(`Thank you for your business. — ${APP_NAME}`, {
    x: margin,
    y: margin,
    size: 9,
    font: regular,
    color: MUTED_COLOR,
  });

  return pdfDoc.save();
}

export { generateInvoicePdf as default };
