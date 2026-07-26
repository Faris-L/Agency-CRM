import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/kanban/:path*",
    "/tasks/:path*",
    "/invoices/:path*",
    "/revenue/:path*",
    "/team/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/reset-password",
    "/update-password",
    "/auth/:path*",
  ],
};
