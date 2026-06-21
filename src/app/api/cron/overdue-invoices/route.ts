import { NextResponse } from "next/server";
import { syncOverdueInvoicesAndNotify } from "@/lib/invoices/sync-overdue";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const processed = await syncOverdueInvoicesAndNotify();

  return NextResponse.json({
    success: true,
    processed,
  });
}
