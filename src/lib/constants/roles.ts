export const ROLES = ["Owner", "Manager", "Member"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  Owner: "Owner",
  Manager: "Manager",
  Member: "Member",
};

export const ROLE_PERMISSIONS = {
  Owner: {
    manageClients: true,
    manageProjects: true,
    manageTasks: true,
    manageInvoices: true,
    manageTeam: true,
    manageBilling: true,
    manageSettings: true,
    viewAssignedTasksOnly: false,
  },
  Manager: {
    manageClients: true,
    manageProjects: true,
    manageTasks: true,
    manageInvoices: false,
    manageTeam: false,
    manageBilling: false,
    manageSettings: false,
    viewAssignedTasksOnly: false,
  },
  Member: {
    manageClients: false,
    manageProjects: false,
    manageTasks: false,
    manageInvoices: false,
    manageTeam: false,
    manageBilling: false,
    manageSettings: false,
    viewAssignedTasksOnly: true,
  },
} as const;
