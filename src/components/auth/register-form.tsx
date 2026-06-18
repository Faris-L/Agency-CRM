"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signUp } from "@/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignUpInput) {
    const result = await signUp(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    if (result.data?.needsEmailConfirmation) {
      setRegisteredEmail(values.email);
      setEmailSent(true);
      toast.success("Check your email to confirm your account.");
      return;
    }

    toast.success("Account created! Welcome to Studioflow.");
    router.push("/dashboard");
    router.refresh();
  }

  if (emailSent) {
    return (
      <AuthCard
        title="Confirm your email"
        description="We sent a confirmation link to your inbox."
        footer={
          <>
            Already confirmed?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            We sent a confirmation email to{" "}
            <span className="font-medium text-foreground">{registeredEmail}</span>.
            Click the link in that email to activate your account and access your
            dashboard.
          </p>
          <p>
            After confirming, you&apos;ll receive a welcome email and can sign in to
            start using Studioflow.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      description="Start with a free workspace for your agency."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField id="fullName" label="Full name" error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Jane Smith"
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName")}
          />
        </FormField>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
