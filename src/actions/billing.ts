"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { PLANS, type Plan } from "@/lib/constants/plans";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Subscription } from "@/types";

const switchPlanSchema = z.object({
  plan: z.enum(PLANS),
});

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

export async function switchSubscriptionPlan(input: {
  plan: Plan;
}): Promise<ActionResult<Subscription>> {
  const parsed = switchPlanSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid plan.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageBilling");
  if (denied) return denied;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .update({ plan: parsed.data.plan, status: "Active" })
    .eq("user_id", ctx.workspaceOwnerId)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to update subscription.");
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/invoices");

  return { success: true, data };
}

export async function getSubscription(): Promise<Subscription | null> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", ctx.workspaceOwnerId)
    .maybeSingle();

  return data;
}
