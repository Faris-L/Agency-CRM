-- Studioflow — Phase 2 / Migration 002
-- Tables + indexes (DB §4, §8)

-- 4.1 profiles -------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        public.user_role NOT NULL DEFAULT 'Owner',
  owner_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT profiles_owner_not_self CHECK (owner_id IS NULL OR owner_id <> id)
);

CREATE INDEX idx_profiles_owner_id ON public.profiles(owner_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 4.2 subscriptions --------------------------------------------------------
CREATE TABLE public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan        public.plan_type NOT NULL DEFAULT 'Free',
  status      public.subscription_status NOT NULL DEFAULT 'Active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE UNIQUE INDEX idx_subscriptions_active_user
  ON public.subscriptions(user_id)
  WHERE status = 'Active';

-- 4.3 clients --------------------------------------------------------------
CREATE TABLE public.clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  company     TEXT,
  email       TEXT,
  phone       TEXT,
  status      public.client_status NOT NULL DEFAULT 'Lead',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_name ON public.clients USING gin(to_tsvector('english', name));

-- 4.4 projects -------------------------------------------------------------
CREATE TABLE public.projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  budget       NUMERIC(12, 2),
  deadline     DATE,
  status       public.project_status NOT NULL DEFAULT 'Planning',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_deadline ON public.projects(deadline);

-- 4.5 tasks ----------------------------------------------------------------
CREATE TABLE public.tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_user  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  due_date       DATE,
  priority       public.task_priority NOT NULL DEFAULT 'Medium',
  status         public.task_status NOT NULL DEFAULT 'Todo',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned_user ON public.tasks(assigned_user);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- 4.6 invoices -------------------------------------------------------------
CREATE TABLE public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  due_date        DATE NOT NULL,
  status          public.invoice_status NOT NULL DEFAULT 'Pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, invoice_number)
);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

-- 4.7 notes ----------------------------------------------------------------
CREATE TABLE public.notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_client_id ON public.notes(client_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);

-- 4.8 team_members ---------------------------------------------------------
CREATE TABLE public.team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  role        public.user_role NOT NULL DEFAULT 'Member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT team_members_role_check CHECK (role IN ('Manager', 'Member')),
  UNIQUE (owner_id, email)
);

CREATE INDEX idx_team_members_owner_id ON public.team_members(owner_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_email ON public.team_members(email);

-- 4.9 client_files ---------------------------------------------------------
CREATE TABLE public.client_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  file_size    INTEGER,
  mime_type    TEXT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_files_client_id ON public.client_files(client_id);
CREATE INDEX idx_client_files_user_id ON public.client_files(user_id);

-- 4.10 activity_logs -------------------------------------------------------
CREATE TABLE public.activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_workspace_id ON public.activity_logs(workspace_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
