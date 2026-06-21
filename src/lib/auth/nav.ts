import { ROLE_PERMISSIONS, type Role } from "@/lib/constants/roles";

export type NavPermissions = Pick<
  (typeof ROLE_PERMISSIONS)[Role],
  | "manageClients"
  | "manageProjects"
  | "manageInvoices"
  | "manageTeam"
  | "manageBilling"
  | "manageSettings"
>;

export type NavPlacement = "sidebar" | "user-menu";

export type NavItem = {
  href: string;
  label: string;
  permission?: keyof NavPermissions;
  always?: boolean;
  placement?: NavPlacement;
};

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", always: true },
  { href: "/clients", label: "Clients", permission: "manageClients" },
  { href: "/projects", label: "Projects", permission: "manageProjects" },
  { href: "/kanban", label: "Kanban", permission: "manageProjects" },
  { href: "/tasks", label: "Tasks", always: true },
  { href: "/invoices", label: "Invoices", permission: "manageInvoices" },
  { href: "/revenue", label: "Revenue", permission: "manageInvoices" },
  { href: "/team", label: "Team", permission: "manageTeam" },
  {
    href: "/billing",
    label: "Billing",
    permission: "manageBilling",
    placement: "user-menu",
  },
  {
    href: "/settings",
    label: "Settings",
    permission: "manageSettings",
    placement: "user-menu",
  },
];

export function getVisibleNavItems(
  permissions: NavPermissions,
  placement: NavPlacement = "sidebar",
): NavItem[] {
  return DASHBOARD_NAV_ITEMS.filter((item) => {
    const itemPlacement = item.placement ?? "sidebar";
    if (itemPlacement !== placement) return false;
    if (item.always) return true;
    if (!item.permission) return true;
    return permissions[item.permission];
  });
}

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
}

export function getPageTitle(
  pathname: string,
  permissions: NavPermissions,
): string {
  if (pathname === "/profile") {
    return "Profile";
  }

  const items = [
    ...getVisibleNavItems(permissions, "sidebar"),
    ...getVisibleNavItems(permissions, "user-menu"),
  ];

  const match = items
    .filter((item) => isNavActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.label ?? "Dashboard";
}
