import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { getWorkspaceContext } from "@/lib/auth/workspace";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    redirect("/login?redirect=" + encodeURIComponent("/profile"));
  }

  return <ProfileView profile={ctx.profile} />;
}
