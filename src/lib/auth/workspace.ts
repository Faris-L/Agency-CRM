import { getAuthUser, getProfile } from "@/lib/auth/session";
import { ROLE_PERMISSIONS, type Role } from "@/lib/constants/roles";
import type { Plan } from "@/lib/constants/plans";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Profile } from "@/types";

export type WorkspaceContext = {
  userId: string;
  profile: Profile;
  workspaceOwnerId: string;
  role: Role;
  permissions: (typeof ROLE_PERMISSIONS)[Role];
  plan: Plan;
};

export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const profile = await getProfile(user.id);
  if (!profile) return null;

  const role = profile.role as Role;
  const workspaceOwnerId = profile.owner_id ?? profile.id;

  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", workspaceOwnerId)
    .maybeSingle();

  const plan = (subscription?.plan ?? "Free") as Plan;

  return {
    userId: user.id,
    profile,
    workspaceOwnerId,
    role,
    permissions: ROLE_PERMISSIONS[role],
    plan,
  };
}

export function permissionDenied<T = void>(): ActionResult<T> {
  return {
    success: false,
    error: "You do not have permission to perform this action.",
  };
}

export function requirePermission(
  ctx: WorkspaceContext,
  permission: keyof (typeof ROLE_PERMISSIONS)[Role],
): ActionResult<never> | null {
  if (!ctx.permissions[permission]) {
    return permissionDenied();
  }
  return null;
}

export async function getWorkspaceMembers(workspaceOwnerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .or(`id.eq.${workspaceOwnerId},owner_id.eq.${workspaceOwnerId}`)
    .order("full_name");

  if (error) {
    return [];
  }

  return data ?? [];
}
