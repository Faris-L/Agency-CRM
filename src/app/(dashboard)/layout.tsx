import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthUser, getProfile } from "@/lib/auth/session";
import { DASHBOARD_HOME } from "@/lib/auth/routes";
import { ROLE_PERMISSIONS, type Role } from "@/lib/constants/roles";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent(DASHBOARD_HOME));
  }

  const profile = await getProfile(user.id);
  const role = (profile?.role ?? "Member") as Role;
  const permissions = ROLE_PERMISSIONS[role];

  return (
    <DashboardShell
      fullName={profile?.full_name}
      email={profile?.email ?? user.email}
      permissions={{
        manageClients: permissions.manageClients,
        manageProjects: permissions.manageProjects,
        manageInvoices: permissions.manageInvoices,
        manageTeam: permissions.manageTeam,
        manageBilling: permissions.manageBilling,
        manageSettings: permissions.manageSettings,
      }}
    >
      {children}
    </DashboardShell>
  );
}
