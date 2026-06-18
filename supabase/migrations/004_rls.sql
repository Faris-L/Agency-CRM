-- Studioflow — Phase 2 / Migration 004
-- Row Level Security: enable + policies (DB §6)
-- Workspace scoping via public.current_workspace_owner();
-- role checks via public.is_workspace_manager() / public.is_workspace_owner().

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_files   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs  ENABLE ROW LEVEL SECURITY;

-- profiles -----------------------------------------------------------------
-- Visible to everyone in the same workspace. Inserts handled by signup trigger.
CREATE POLICY "profiles_select_workspace"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_workspace_owner_id(id) = public.current_workspace_owner());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- subscriptions ------------------------------------------------------------
-- Workspace members can read the plan; only the Owner can change it.
CREATE POLICY "subscriptions_select_workspace"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = public.current_workspace_owner());

CREATE POLICY "subscriptions_update_owner"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_owner())
  WITH CHECK (user_id = public.current_workspace_owner() AND public.is_workspace_owner());

-- clients ------------------------------------------------------------------
CREATE POLICY "clients_select_workspace"
  ON public.clients FOR SELECT
  TO authenticated
  USING (user_id = public.current_workspace_owner());

CREATE POLICY "clients_insert_manager"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_workspace_owner() AND public.is_workspace_manager());

CREATE POLICY "clients_update_manager"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_manager())
  WITH CHECK (user_id = public.current_workspace_owner() AND public.is_workspace_manager());

CREATE POLICY "clients_delete_manager"
  ON public.clients FOR DELETE
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_manager());

-- projects -----------------------------------------------------------------
CREATE POLICY "projects_select_workspace"
  ON public.projects FOR SELECT
  TO authenticated
  USING (user_id = public.current_workspace_owner());

CREATE POLICY "projects_insert_manager"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_workspace_owner() AND public.is_workspace_manager());

CREATE POLICY "projects_update_manager"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_manager())
  WITH CHECK (user_id = public.current_workspace_owner() AND public.is_workspace_manager());

CREATE POLICY "projects_delete_manager"
  ON public.projects FOR DELETE
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_manager());

-- tasks --------------------------------------------------------------------
-- Scoped via parent project's workspace.
-- Managers see/manage all workspace tasks; Members only their assigned tasks.
CREATE POLICY "tasks_select_workspace"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.user_id = public.current_workspace_owner()
    )
    AND (public.is_workspace_manager() OR assigned_user = (SELECT auth.uid()))
  );

CREATE POLICY "tasks_insert_manager"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_workspace_manager()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.user_id = public.current_workspace_owner()
    )
  );

CREATE POLICY "tasks_update_workspace"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.user_id = public.current_workspace_owner()
    )
    AND (public.is_workspace_manager() OR assigned_user = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.user_id = public.current_workspace_owner()
    )
    AND (public.is_workspace_manager() OR assigned_user = (SELECT auth.uid()))
  );

CREATE POLICY "tasks_delete_manager"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    public.is_workspace_manager()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.user_id = public.current_workspace_owner()
    )
  );

-- invoices -----------------------------------------------------------------
-- Owner only (PRD RBAC matrix).
CREATE POLICY "invoices_select_owner"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_owner());

CREATE POLICY "invoices_insert_owner"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_workspace_owner() AND public.is_workspace_owner());

CREATE POLICY "invoices_update_owner"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_owner())
  WITH CHECK (user_id = public.current_workspace_owner() AND public.is_workspace_owner());

CREATE POLICY "invoices_delete_owner"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_owner());

-- notes --------------------------------------------------------------------
-- Scoped via parent client's workspace.
CREATE POLICY "notes_select_workspace"
  ON public.notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = notes.client_id
        AND c.user_id = public.current_workspace_owner()
    )
  );

CREATE POLICY "notes_insert_manager"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_workspace_manager()
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = notes.client_id
        AND c.user_id = public.current_workspace_owner()
    )
  );

CREATE POLICY "notes_update_author_or_owner"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = notes.client_id
        AND c.user_id = public.current_workspace_owner()
    )
    AND (user_id = (SELECT auth.uid()) OR public.is_workspace_owner())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = notes.client_id
        AND c.user_id = public.current_workspace_owner()
    )
    AND (user_id = (SELECT auth.uid()) OR public.is_workspace_owner())
  );

CREATE POLICY "notes_delete_manager"
  ON public.notes FOR DELETE
  TO authenticated
  USING (
    public.is_workspace_manager()
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = notes.client_id
        AND c.user_id = public.current_workspace_owner()
    )
  );

-- team_members -------------------------------------------------------------
-- Owner manages; all workspace members can view.
CREATE POLICY "team_members_select_workspace"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (owner_id = public.current_workspace_owner());

CREATE POLICY "team_members_insert_owner"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = public.current_workspace_owner() AND public.is_workspace_owner());

CREATE POLICY "team_members_update_owner"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (owner_id = public.current_workspace_owner() AND public.is_workspace_owner())
  WITH CHECK (owner_id = public.current_workspace_owner() AND public.is_workspace_owner());

CREATE POLICY "team_members_delete_owner"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (owner_id = public.current_workspace_owner() AND public.is_workspace_owner());

-- client_files -------------------------------------------------------------
CREATE POLICY "client_files_select_workspace"
  ON public.client_files FOR SELECT
  TO authenticated
  USING (user_id = public.current_workspace_owner());

CREATE POLICY "client_files_insert_manager"
  ON public.client_files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_workspace_owner() AND public.is_workspace_manager());

CREATE POLICY "client_files_delete_manager"
  ON public.client_files FOR DELETE
  TO authenticated
  USING (user_id = public.current_workspace_owner() AND public.is_workspace_manager());

-- activity_logs ------------------------------------------------------------
-- Read by workspace members; written by any authenticated workspace member.
CREATE POLICY "activity_logs_select_workspace"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (workspace_id = public.current_workspace_owner());

CREATE POLICY "activity_logs_insert_workspace"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id = public.current_workspace_owner()
    AND user_id = (SELECT auth.uid())
  );
