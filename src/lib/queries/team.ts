import { createClient } from "@/lib/supabase/server";
import type { Profile, TeamMember } from "@/types";

export type TeamMemberRow = TeamMember & {
  profiles: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
};

export type TeamMemberListItem = {
  id: string;
  email: string;
  role: Profile["role"];
  fullName: string | null;
  avatarUrl: string | null;
  userId: string | null;
  status: "active" | "pending";
  isOwner: boolean;
  createdAt: string;
};

export async function getTeamMemberRows(workspaceOwnerId: string): Promise<TeamMemberRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*, profiles!team_members_user_id_fkey(id, full_name, email, avatar_url)")
    .eq("owner_id", workspaceOwnerId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch team members:", error.message);
    return [];
  }

  return (data ?? []) as TeamMemberRow[];
}

export async function getTeamMemberList(workspaceOwnerId: string): Promise<TeamMemberListItem[]> {
  const supabase = await createClient();

  const [ownerResult, membersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, created_at")
      .eq("id", workspaceOwnerId)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("id, email, role, user_id, created_at, profiles!team_members_user_id_fkey(full_name, avatar_url)")
      .eq("owner_id", workspaceOwnerId)
      .order("created_at", { ascending: true }),
  ]);

  const owner = ownerResult.data;
  const members = membersResult.data ?? [];

  const list: TeamMemberListItem[] = [];

  if (owner) {
    list.push({
      id: owner.id,
      email: owner.email,
      role: owner.role,
      fullName: owner.full_name,
      avatarUrl: owner.avatar_url,
      userId: owner.id,
      status: "active",
      isOwner: true,
      createdAt: owner.created_at,
    });
  }

  for (const member of members) {
    const profile = member.profiles as Pick<Profile, "full_name" | "avatar_url"> | null;

    list.push({
      id: member.id,
      email: member.email,
      role: member.role,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      userId: member.user_id,
      status: member.user_id ? "active" : "pending",
      isOwner: false,
      createdAt: member.created_at,
    });
  }

  return list;
}
