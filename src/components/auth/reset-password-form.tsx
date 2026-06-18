"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    const result = await requestPasswordReset(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSentTo(values.email);
    setEmailSent(true);
    toast.success("Password reset email sent.");
  }

  if (emailSent) {
    return (
      <AuthCard
        title="Check your email"
        description="We sent a password reset link."
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          If an account exists for{" "}
          <span className="font-medium text-foreground">{sentTo}</span>, you&apos;ll
          receive an email with a link to reset your password.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset password"
      description="We'll email you a link to set a new password."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending link…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
