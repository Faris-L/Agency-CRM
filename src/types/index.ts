import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;
export type Subscription = Tables<"subscriptions">;
export type Client = Tables<"clients">;
export type Project = Tables<"projects">;
export type Task = Tables<"tasks">;
export type Invoice = Tables<"invoices">;
export type Note = Tables<"notes">;
export type TeamMember = Tables<"team_members">;
export type ClientFile = Tables<"client_files">;
export type ActivityLog = Tables<"activity_logs">;

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
