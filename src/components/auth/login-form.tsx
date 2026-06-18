"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signIn } from "@/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DASHBOARD_HOME } from "@/lib/auth/routes";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? DASHBOARD_HOME;
  const authError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    const result = await signIn(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Welcome back!");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AuthCard
      title="Sign in"
      description="Access your agency workspace."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {authError ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {authError === "missing_code"
            ? "The sign-in link is invalid or expired. Please try again."
            : authError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@agency.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </FormField>

        <div className="flex justify-end">
          <Link
            href="/reset-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
