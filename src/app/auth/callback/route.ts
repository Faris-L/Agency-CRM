import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    user?.email_confirmed_at &&
    !user.user_metadata?.welcome_email_sent
  ) {
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "there";

    if (user.email) {
      const result = await sendWelcomeEmail({
        to: user.email,
        fullName,
      });

      if (result.success) {
        await supabase.auth.updateUser({
          data: { welcome_email_sent: true },
        });
      }
    }
  }

  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
