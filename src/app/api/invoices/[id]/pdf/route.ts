import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import { getInvoiceById } from "@/lib/queries/invoices";
import { generateInvoicePdf } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.permissions.manageInvoices) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!PLAN_LIMITS[ctx.plan].pdfExport) {
    return NextResponse.json(
      { error: "PDF export requires a Pro or Agency plan." },
      { status: 403 },
    );
  }

  const invoice = await getInvoiceById(id);

  if (!invoice || invoice.user_id !== ctx.workspaceOwnerId) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", ctx.workspaceOwnerId)
    .maybeSingle();

  const pdfBytes = await generateInvoicePdf({
    invoice,
    ownerName: ownerProfile?.full_name ?? "",
    ownerEmail: ownerProfile?.email ?? ctx.profile.email,
  });

  const filename = `${invoice.invoice_number.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
