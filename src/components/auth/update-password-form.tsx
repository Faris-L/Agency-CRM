"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updatePassword } from "@/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DASHBOARD_HOME } from "@/lib/auth/routes";
import {
  updatePasswordSchema,
  type UpdatePasswordInput,
} from "@/lib/validations/auth";

export function UpdatePasswordForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: UpdatePasswordInput) {
    const result = await updatePassword(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Password updated successfully.");
    router.push(DASHBOARD_HOME);
    router.refresh();
  }

  return (
    <AuthCard
      title="Set new password"
      description="Choose a strong password for your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField id="password" label="New password" error={errors.password?.message}>
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
          label="Confirm new password"
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
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
