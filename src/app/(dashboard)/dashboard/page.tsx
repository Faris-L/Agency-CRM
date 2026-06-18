import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { getAuthUser, getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getAuthUser();
  const profile = user ? await getProfile(user.id) : null;

  const supabase = await createClient();
  const { data: subscription } = user
    ? await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Your agency workspace is ready. Core modules arrive in the next phases."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground">Account</p>
          <p className="mt-2 text-lg font-semibold">{profile?.email ?? user?.email}</p>
          <p className="mt-1 text-sm text-muted-foreground">Role: {profile?.role ?? "Owner"}</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground">Subscription</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-lg font-semibold">{subscription?.plan ?? "Free"}</p>
            {subscription?.status ? (
              <Badge variant="secondary">{subscription.status}</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Demo billing — Phase 5</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground">Next up</p>
          <p className="mt-2 text-lg font-semibold">Phase 3 — Core modules</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clients, projects, and tasks with full CRUD.
          </p>
        </div>
      </div>
    </div>
  );
}
