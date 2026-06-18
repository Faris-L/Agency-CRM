-- Studioflow — Phase 2 / Migration 001
-- Custom enum types (PRD §9, DB §3)

CREATE TYPE public.user_role AS ENUM ('Owner', 'Manager', 'Member');
CREATE TYPE public.plan_type AS ENUM ('Free', 'Pro', 'Agency');
CREATE TYPE public.subscription_status AS ENUM ('Active', 'Cancelled');

CREATE TYPE public.client_status AS ENUM ('Lead', 'Active', 'Inactive');
CREATE TYPE public.project_status AS ENUM ('Planning', 'In Progress', 'Review', 'Completed');
CREATE TYPE public.task_priority AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE public.task_status AS ENUM ('Todo', 'Doing', 'Done');
CREATE TYPE public.invoice_status AS ENUM ('Pending', 'Paid', 'Overdue');
