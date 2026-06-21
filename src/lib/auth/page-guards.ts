import type { WorkspaceContext } from "@/lib/auth/workspace";
import { ROLE_PERMISSIONS, type Role } from "@/lib/constants/roles";
import { redirect } from "next/navigation";

export type PagePermission = keyof (typeof ROLE_PERMISSIONS)[Role];

export function redirectIfMissingPermission(
  ctx: WorkspaceContext,
  permission: PagePermission,
  fallback = "/dashboard",
): void {
  if (!ctx.permissions[permission]) {
    redirect(fallback);
  }
}
