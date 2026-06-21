"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { cancelTeamInvite, removeTeamMember, updateTeamMemberRole } from "@/actions/team";
import { TeamInviteDialog } from "@/components/team/team-invite-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { UpsellBanner } from "@/components/shared/upsell-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { getTeamUpsellMessage, type Plan } from "@/lib/constants/plans";
import { TEAM_INVITE_ROLES } from "@/lib/validations/team";
import type { TeamMemberListItem } from "@/lib/queries/team";

type TeamViewProps = {
  members: TeamMemberListItem[];
  plan: Plan;
  canManage: boolean;
};

export function TeamView({ members, plan, canManage }: TeamViewProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMemberListItem | null>(null);
  const [removing, setRemoving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canInvite = canManage && getTeamUpsellMessage(plan) === "";
  const upsellMessage = getTeamUpsellMessage(plan);

  async function handleRoleChange(memberId: string, role: (typeof TEAM_INVITE_ROLES)[number]) {
    setUpdatingId(memberId);
    const result = await updateTeamMemberRole({ id: memberId, role });
    setUpdatingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Role updated.");
    router.refresh();
  }

  async function handleRemove() {
    if (!removeTarget) return;

    setRemoving(true);
    const result = removeTarget.status === "pending"
      ? await cancelTeamInvite({ id: removeTarget.id })
      : await removeTeamMember({ id: removeTarget.id });
    setRemoving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(removeTarget.status === "pending" ? "Invitation cancelled." : "Team member removed.");
    setRemoveTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Invite managers and members to collaborate in your workspace."
        actions={
          canManage ? (
            <Button onClick={() => setInviteOpen(true)} disabled={!canInvite}>
              <UserPlus className="size-4" />
              Invite member
            </Button>
          ) : null
        }
      />

      {canManage && upsellMessage ? <UpsellBanner message={upsellMessage} /> : null}

      {members.length <= 1 && !members.some((m) => m.status === "pending") ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description={
            canInvite
              ? "Invite colleagues to help manage clients, projects, and tasks."
              : "Upgrade to the Agency plan to invite team members."
          }
          action={
            canInvite ? (
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4" />
                Invite member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_auto] gap-4 border-b px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
            <span>Member</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y">
            {members.map((member) => (
              <li
                key={member.id}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center sm:gap-4"
              >
                <div>
                  <p className="font-medium">{member.fullName ?? member.email}</p>
                  {member.fullName ? (
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  ) : null}
                </div>

                <div>
                  {member.isOwner ? (
                    <Badge variant="secondary">{ROLE_LABELS.Owner}</Badge>
                  ) : canManage && member.status === "active" ? (
                    <Select
                      value={member.role}
                      disabled={updatingId === member.id}
                      onValueChange={(value) =>
                        handleRoleChange(member.id, value as (typeof TEAM_INVITE_ROLES)[number])
                      }
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_INVITE_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                  )}
                </div>

                <div>
                  {member.isOwner ? (
                    <Badge>Active</Badge>
                  ) : member.status === "pending" ? (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="size-3" />
                      Pending
                    </Badge>
                  ) : (
                    <Badge>Active</Badge>
                  )}
                </div>

                <div className="flex justify-end">
                  {canManage && !member.isOwner ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRemoveTarget(member)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">
                        {member.status === "pending" ? "Cancel invite" : "Remove member"}
                      </span>
                    </Button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <TeamInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={removeTarget?.status === "pending" ? "Cancel invitation" : "Remove team member"}
        description={
          removeTarget?.status === "pending"
            ? `Cancel the invitation for ${removeTarget.email}?`
            : `Remove ${removeTarget?.fullName ?? removeTarget?.email} from your workspace? They will lose access to your data.`
        }
        confirmLabel={removeTarget?.status === "pending" ? "Cancel invite" : "Remove"}
        variant="destructive"
        loading={removing}
        onConfirm={handleRemove}
      />
    </div>
  );
}
