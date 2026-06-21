import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_LIMITS, type Plan } from "@/lib/constants/plans";
import { getPlanLimitMessage } from "@/lib/constants/plans";
import type { Database } from "@/types/database";

type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; error: string; upsell?: boolean };

export async function checkClientLimit(
  supabase: SupabaseClient<Database>,
  workspaceOwnerId: string,
  plan: Plan,
): Promise<LimitCheckResult> {
  const maxClients = PLAN_LIMITS[plan].maxClients;
  if (maxClients === null) return { allowed: true };

  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", workspaceOwnerId);

  if (error) {
    return { allowed: false, error: "Unable to verify plan limits.", upsell: false };
  }

  if ((count ?? 0) >= maxClients) {
    return {
      allowed: false,
      error: getPlanLimitMessage(plan, "clients"),
      upsell: true,
    };
  }

  return { allowed: true };
}

export async function checkProjectLimit(
  supabase: SupabaseClient<Database>,
  workspaceOwnerId: string,
  plan: Plan,
): Promise<LimitCheckResult> {
  const maxProjects = PLAN_LIMITS[plan].maxProjects;
  if (maxProjects === null) return { allowed: true };

  const { count, error } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", workspaceOwnerId);

  if (error) {
    return { allowed: false, error: "Unable to verify plan limits.", upsell: false };
  }

  if ((count ?? 0) >= maxProjects) {
    return {
      allowed: false,
      error: getPlanLimitMessage(plan, "projects"),
      upsell: true,
    };
  }

  return { allowed: true };
}
