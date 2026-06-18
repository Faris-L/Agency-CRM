"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { DASHBOARD_HOME } from "@/lib/auth/routes";
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

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

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

export async function signUp(
  input: SignUpInput,
): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
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
