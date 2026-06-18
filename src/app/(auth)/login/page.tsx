import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
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
