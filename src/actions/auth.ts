"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { DASHBOARD_HOME } from "@/lib/auth/routes";
import { isEmailConfirmationSkipped } from "@/lib/env/auth-config";
import { getAppUrl } from "@/lib/env/app-url";
import { sendWelcomeEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
  type UpdatePasswordInput,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

export async function signIn(input: SignInInput): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: getAuthErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

async function signUpWithAutoConfirm(
  input: SignUpInput,
): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });

  if (error) {
    return { success: false, error: getAuthErrorMessage(error.message) };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (signInError) {
    return { success: false, error: getAuthErrorMessage(signInError.message) };
  }

  if (data.user?.email) {
    const welcomeResult = await sendWelcomeEmail({
      to: data.user.email,
      fullName: input.fullName,
    });

    if (welcomeResult.success) {
      await supabase.auth.updateUser({
        data: { welcome_email_sent: true },
      });
    }
  }

  revalidatePath("/", "layout");
  return { success: true, data: { needsEmailConfirmation: false } };
}

export async function signUp(
  input: SignUpInput,
): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (isEmailConfirmationSkipped()) {
    return signUpWithAutoConfirm(parsed.data);
  }

  const appUrl = getAppUrl();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${appUrl}/auth/callback?next=${DASHBOARD_HOME}`,
    },
  });

  if (error) {
    return { success: false, error: getAuthErrorMessage(error.message) };
  }

  return {
    success: true,
    data: { needsEmailConfirmation: !data.session },
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const appUrl = getAppUrl();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { success: false, error: getAuthErrorMessage(error.message) };
  }

  return { success: true };
}

export async function updatePassword(input: UpdatePasswordInput): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to update your password." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: getAuthErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
