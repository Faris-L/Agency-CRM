import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { DASHBOARD_HOME } from "@/lib/auth/routes";
import { getAuthUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const user = await getAuthUser();
  if (user) {
    redirect(DASHBOARD_HOME);
  }

  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
