export const AUTH_ROUTES = ["/login", "/register", "/reset-password"] as const;

export const PUBLIC_PATHS = ["/", "/pricing"] as const;

export const DASHBOARD_HOME = "/dashboard";

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number]) ||
    isAuthRoute(pathname) ||
    pathname.startsWith("/auth/")
  );
}
