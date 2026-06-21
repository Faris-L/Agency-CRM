import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { TeamView } from "@/components/team/team-view";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getTeamMemberList } from "@/lib/queries/team";

export const metadata: Metadata = {
  title: "Team",
};

async function TeamContent() {
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return null;
  }

  if (!ctx.permissions.manageTeam) {
    redirect("/dashboard");
  }

  const members = await getTeamMemberList(ctx.workspaceOwnerId);

  return (
    <TeamView members={members} plan={ctx.plan} canManage={ctx.permissions.manageTeam} />
  );
}

export default function TeamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <TeamContent />
    </Suspense>
  );
}
