export const PLANS = ["Free", "Pro", "Agency"] as const;
export type Plan = (typeof PLANS)[number];

export const SUBSCRIPTION_STATUSES = ["Active", "Cancelled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PLAN_LIMITS: Record<
  Plan,
  { maxClients: number | null; maxProjects: number | null; pdfExport: boolean; teamMembers: boolean }
> = {
  Free: {
    maxClients: 5,
    maxProjects: 3,
    pdfExport: false,
    teamMembers: false,
  },
  Pro: {
    maxClients: null,
    maxProjects: null,
    pdfExport: true,
    teamMembers: false,
  },
  Agency: {
    maxClients: null,
    maxProjects: null,
    pdfExport: true,
    teamMembers: true,
  },
};

export const PLAN_FEATURES: Record<Plan, string[]> = {
  Free: ["Up to 5 clients", "Up to 3 projects"],
  Pro: ["Unlimited clients", "Unlimited projects", "PDF Export"],
  Agency: ["Everything in Pro", "Team Members", "Advanced Features"],
};

export const PLAN_PRICES: Record<Plan, number> = {
  Free: 0,
  Pro: 29,
  Agency: 79,
};

export function getPlanLimitMessage(plan: Plan, resource: "clients" | "projects"): string {
  const limits = PLAN_LIMITS[plan];
  const max = resource === "clients" ? limits.maxClients : limits.maxProjects;

  if (max === null) return "";

  const label = resource === "clients" ? "clients" : "projects";
  return `Your ${plan} plan allows up to ${max} ${label}. Upgrade to Pro for unlimited ${label}.`;
}

export function getTeamUpsellMessage(plan: Plan): string {
  if (PLAN_LIMITS[plan].teamMembers) return "";
  return "Team members are available on the Agency plan. Upgrade to invite managers and members to your workspace.";
}
