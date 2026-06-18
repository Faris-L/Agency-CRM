import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getAuthUser, getProfile } from "@/lib/auth/session";
import { DASHBOARD_HOME } from "@/lib/auth/routes";

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

  return (
    <div className="flex min-h-full flex-col">
      <DashboardHeader
        fullName={profile?.full_name}
        email={profile?.email ?? user.email}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
