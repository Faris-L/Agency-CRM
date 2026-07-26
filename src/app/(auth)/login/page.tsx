import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { DASHBOARD_HOME } from "@/lib/auth/routes";
import { getAuthUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const user = await getAuthUser();
  if (user) {
    redirect(DASHBOARD_HOME);
  }

  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <LoadingSpinner className="size-8" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
