import type { Role } from "@/lib/constants/roles";
import type { Plan, SubscriptionStatus } from "@/lib/constants/plans";
import type {
  ClientStatus,
  InvoiceStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/lib/constants/app";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  created_at: string;
};

export type Client = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  client_id: string;
  user_id: string;
  name: string;
  description: string | null;
  budget: number | null;
  deadline: string | null;
  status: ProjectStatus;
  created_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  assigned_user: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
};

export type Invoice = {
  id: string;
  client_id: string;
  project_id: string | null;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
};

export type Note = {
  id: string;
  client_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type TeamMember = {
  id: string;
  owner_id: string;
  email: string;
  role: Role;
  created_at: string;
};

export type ClientFile = {
  id: string;
  client_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
};

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
