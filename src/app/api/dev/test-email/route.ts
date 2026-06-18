import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  let to: string | undefined;

  try {
    const body = (await request.json()) as { to?: string };
    to = body.to;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!to) {
    return NextResponse.json(
      { error: 'Missing "to" field. Example: { "to": "you@example.com" }' },
      { status: 400 },
    );
  }

  const result = await sendTestEmail(to);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    messageId: result.id,
    hint: "Check the inbox for the address you used. Resend sandbox may only deliver to your Resend account email.",
  });
}
