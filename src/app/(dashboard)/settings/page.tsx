import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings/settings-view";
import { redirectIfMissingPermission } from "@/lib/auth/page-guards";
import { getWorkspaceContext } from "@/lib/auth/workspace";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    redirect("/login");
  }

  redirectIfMissingPermission(ctx, "manageSettings");

  return <SettingsView profile={ctx.profile} />;
}
