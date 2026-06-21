"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { DASHBOARD_HOME } from "@/lib/auth/routes";
import { getAppUrl } from "@/lib/env/app-url";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import {
  teamInviteSchema,
  teamMemberIdSchema,
  teamMemberRoleSchema,
  type TeamInviteInput,
  type TeamMemberIdInput,
  type TeamMemberRoleInput,
} from "@/lib/validations/team";
import type { ActionResult, TeamMember } from "@/types";

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

export async function inviteTeamMember(input: TeamInviteInput): Promise<ActionResult<TeamMember>> {
  const parsed = teamInviteSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageTeam");
  if (denied) return denied;

  if (!PLAN_LIMITS[ctx.plan].teamMembers) {
    return validationError("Team members require the Agency plan. Upgrade to invite your team.");
  }

  const email = parsed.data.email.toLowerCase();

  if (email === ctx.profile.email.toLowerCase()) {
    return validationError("You cannot invite yourself.");
  }

  const supabase = await createClient();

  const { data: existingInvite } = await supabase
    .from("team_members")
    .select("id")
    .eq("owner_id", ctx.workspaceOwnerId)
    .ilike("email", email)
    .maybeSingle();

  if (existingInvite) {
    return validationError("This email has already been invited.");
  }

  const { data: existingMember } = await supabase
    .from("profiles")
    .select("id")
    .eq("owner_id", ctx.workspaceOwnerId)
    .ilike("email", email)
    .maybeSingle();

  if (existingMember) {
    return validationError("This user is already a team member.");
  }

  const { data, error } = await supabase
    .from("team_members")
    .insert({
      owner_id: ctx.workspaceOwnerId,
      email,
      role: parsed.data.role,
    })
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to create invitation.");
  }

  try {
    const admin = createAdminClient();
    const appUrl = getAppUrl();
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=${DASHBOARD_HOME}`,
      data: { invited_role: parsed.data.role },
    });

    if (inviteError) {
      await supabase.from("team_members").delete().eq("id", data.id);
      return validationError(inviteError.message);
    }
  } catch (err) {
    await supabase.from("team_members").delete().eq("id", data.id);
    const message = err instanceof Error ? err.message : "Failed to send invitation email.";
    return validationError(message);
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Team Member Invited",
    entityType: "team_member",
    entityId: data.id,
  });

  revalidatePath("/team");
  return { success: true, data };
}

export async function updateTeamMemberRole(
  input: TeamMemberRoleInput,
): Promise<ActionResult<TeamMember>> {
  const parsed = teamMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageTeam");
  if (denied) return denied;

  if (!PLAN_LIMITS[ctx.plan].teamMembers) {
    return validationError("Team management requires the Agency plan.");
  }

  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("team_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.id)
    .eq("owner_id", ctx.workspaceOwnerId)
    .select()
    .single();

  if (error || !member) {
    return validationError(error?.message ?? "Failed to update team member.");
  }

  if (member.user_id) {
    await supabase
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", member.user_id)
      .eq("owner_id", ctx.workspaceOwnerId);
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Team Member Role Updated",
    entityType: "team_member",
    entityId: member.id,
  });

  revalidatePath("/team");
  return { success: true, data: member };
}

export async function removeTeamMember(input: TeamMemberIdInput): Promise<ActionResult> {
  const parsed = teamMemberIdSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid team member ID.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageTeam");
  if (denied) return denied;

  const supabase = await createClient();

  const { data: member } = await supabase
    .from("team_members")
    .select("id, user_id")
    .eq("id", parsed.data.id)
    .eq("owner_id", ctx.workspaceOwnerId)
    .maybeSingle();

  if (!member) {
    return validationError("Team member not found.");
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", parsed.data.id)
    .eq("owner_id", ctx.workspaceOwnerId);

  if (error) {
    return validationError(error.message);
  }

  if (member.user_id) {
    await supabase
      .from("profiles")
      .update({ owner_id: null, role: "Owner" })
      .eq("id", member.user_id);

    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", member.user_id)
      .maybeSingle();

    if (!existingSubscription) {
      await supabase.from("subscriptions").insert({
        user_id: member.user_id,
        plan: "Free",
        status: "Active",
      });
    }
  }

  await logActivity(supabase, {
    userId: ctx.userId,
    workspaceId: ctx.workspaceOwnerId,
    action: "Team Member Removed",
    entityType: "team_member",
    entityId: parsed.data.id,
  });

  revalidatePath("/team");
  return { success: true };
}

export async function cancelTeamInvite(input: TeamMemberIdInput): Promise<ActionResult> {
  return removeTeamMember(input);
}
