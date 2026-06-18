-- Studioflow — Phase 2 / Migration 006
-- Security & performance hardening based on Supabase advisors:
--   * Move RLS helper functions into a non-exposed `private` schema
--     (SECURITY DEFINER functions in `public` are callable via REST RPC).
--   * Lock down maintenance/trigger functions (REVOKE EXECUTE).
--   * Remove broad SELECT policy on the public `avatars` bucket (listing).
--   * Add covering index for invoices.project_id foreign key.

-- 1. Covering index for FK ------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);

-- 2. Avatars bucket: drop broad listing policy (public URL access remains) -
DROP POLICY IF EXISTS "avatars_read_all" ON storage.objects;

-- 3. Lock down maintenance / trigger functions ----------------------------
-- handle_new_user runs via the auth.users trigger regardless of EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- mark_overdue_invoices is for server-side / cron use only.
REVOKE EXECUTE ON FUNCTION public.mark_overdue_invoices() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_overdue_invoices() TO service_role;

-- Unused helper (not referenced by any policy).
DROP FUNCTION IF EXISTS public.auth_user_role();

-- 4. Private schema for RLS helper functions -------------------------------
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.get_workspace_owner_id(uid UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT owner_id FROM public.profiles WHERE id = uid), uid);
$$;

CREATE OR REPLACE FUNCTION private.current_workspace_owner()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.get_workspace_owner_id((SELECT auth.uid()));
$$;

CREATE OR REPLACE FUNCTION private.is_workspace_manager()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('Owner', 'Manager'));
$$;

CREATE OR REPLACE FUNCTION private.is_workspace_owner()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'Owner');
$$;

GRANT EXECUTE ON FUNCTION
  private.get_workspace_owner_id(UUID),
  private.current_workspace_owner(),
  private.is_workspace_manager(),
  private.is_workspace_owner()
  TO authenticated;

-- 5. Recreate policies to use private.* helpers ---------------------------
-- profiles
DROP POLICY IF EXISTS "profiles_select_workspace" ON public.profiles;
CREATE POLICY "profiles_select_workspace" ON public.profiles FOR SELECT TO authenticated
  USING (private.get_workspace_owner_id(id) = private.current_workspace_owner());

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_select_workspace" ON public.subscriptions;
CREATE POLICY "subscriptions_select_workspace" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = private.current_workspace_owner());
DROP POLICY IF EXISTS "subscriptions_update_owner" ON public.subscriptions;
CREATE POLICY "subscriptions_update_owner" ON public.subscriptions FOR UPDATE TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_owner())
  WITH CHECK (user_id = private.current_workspace_owner() AND private.is_workspace_owner());

-- clients
DROP POLICY IF EXISTS "clients_select_workspace" ON public.clients;
CREATE POLICY "clients_select_workspace" ON public.clients FOR SELECT TO authenticated
  USING (user_id = private.current_workspace_owner());
DROP POLICY IF EXISTS "clients_insert_manager" ON public.clients;
CREATE POLICY "clients_insert_manager" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (user_id = private.current_workspace_owner() AND private.is_workspace_manager());
DROP POLICY IF EXISTS "clients_update_manager" ON public.clients;
CREATE POLICY "clients_update_manager" ON public.clients FOR UPDATE TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_manager())
  WITH CHECK (user_id = private.current_workspace_owner() AND private.is_workspace_manager());
DROP POLICY IF EXISTS "clients_delete_manager" ON public.clients;
CREATE POLICY "clients_delete_manager" ON public.clients FOR DELETE TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_manager());

-- projects
DROP POLICY IF EXISTS "projects_select_workspace" ON public.projects;
CREATE POLICY "projects_select_workspace" ON public.projects FOR SELECT TO authenticated
  USING (user_id = private.current_workspace_owner());
DROP POLICY IF EXISTS "projects_insert_manager" ON public.projects;
CREATE POLICY "projects_insert_manager" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (user_id = private.current_workspace_owner() AND private.is_workspace_manager());
DROP POLICY IF EXISTS "projects_update_manager" ON public.projects;
CREATE POLICY "projects_update_manager" ON public.projects FOR UPDATE TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_manager())
  WITH CHECK (user_id = private.current_workspace_owner() AND private.is_workspace_manager());
DROP POLICY IF EXISTS "projects_delete_manager" ON public.projects;
CREATE POLICY "projects_delete_manager" ON public.projects FOR DELETE TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_manager());

-- tasks
DROP POLICY IF EXISTS "tasks_select_workspace" ON public.tasks;
CREATE POLICY "tasks_select_workspace" ON public.tasks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = tasks.project_id AND p.user_id = private.current_workspace_owner())
    AND (private.is_workspace_manager() OR assigned_user = (SELECT auth.uid()))
  );
DROP POLICY IF EXISTS "tasks_insert_manager" ON public.tasks;
CREATE POLICY "tasks_insert_manager" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    private.is_workspace_manager()
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = tasks.project_id AND p.user_id = private.current_workspace_owner())
  );
DROP POLICY IF EXISTS "tasks_update_workspace" ON public.tasks;
CREATE POLICY "tasks_update_workspace" ON public.tasks FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = tasks.project_id AND p.user_id = private.current_workspace_owner())
    AND (private.is_workspace_manager() OR assigned_user = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = tasks.project_id AND p.user_id = private.current_workspace_owner())
    AND (private.is_workspace_manager() OR assigned_user = (SELECT auth.uid()))
  );
DROP POLICY IF EXISTS "tasks_delete_manager" ON public.tasks;
CREATE POLICY "tasks_delete_manager" ON public.tasks FOR DELETE TO authenticated
  USING (
    private.is_workspace_manager()
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = tasks.project_id AND p.user_id = private.current_workspace_owner())
  );

-- invoices
DROP POLICY IF EXISTS "invoices_select_owner" ON public.invoices;
CREATE POLICY "invoices_select_owner" ON public.invoices FOR SELECT TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_owner());
DROP POLICY IF EXISTS "invoices_insert_owner" ON public.invoices;
CREATE POLICY "invoices_insert_owner" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (user_id = private.current_workspace_owner() AND private.is_workspace_owner());
DROP POLICY IF EXISTS "invoices_update_owner" ON public.invoices;
CREATE POLICY "invoices_update_owner" ON public.invoices FOR UPDATE TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_owner())
  WITH CHECK (user_id = private.current_workspace_owner() AND private.is_workspace_owner());
DROP POLICY IF EXISTS "invoices_delete_owner" ON public.invoices;
CREATE POLICY "invoices_delete_owner" ON public.invoices FOR DELETE TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_owner());

-- notes
DROP POLICY IF EXISTS "notes_select_workspace" ON public.notes;
CREATE POLICY "notes_select_workspace" ON public.notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = notes.client_id AND c.user_id = private.current_workspace_owner()));
DROP POLICY IF EXISTS "notes_insert_manager" ON public.notes;
CREATE POLICY "notes_insert_manager" ON public.notes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND private.is_workspace_manager()
    AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = notes.client_id AND c.user_id = private.current_workspace_owner())
  );
DROP POLICY IF EXISTS "notes_update_author_or_owner" ON public.notes;
CREATE POLICY "notes_update_author_or_owner" ON public.notes FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = notes.client_id AND c.user_id = private.current_workspace_owner())
    AND (user_id = (SELECT auth.uid()) OR private.is_workspace_owner())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = notes.client_id AND c.user_id = private.current_workspace_owner())
    AND (user_id = (SELECT auth.uid()) OR private.is_workspace_owner())
  );
DROP POLICY IF EXISTS "notes_delete_manager" ON public.notes;
CREATE POLICY "notes_delete_manager" ON public.notes FOR DELETE TO authenticated
  USING (
    private.is_workspace_manager()
    AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = notes.client_id AND c.user_id = private.current_workspace_owner())
  );

-- team_members
DROP POLICY IF EXISTS "team_members_select_workspace" ON public.team_members;
CREATE POLICY "team_members_select_workspace" ON public.team_members FOR SELECT TO authenticated
  USING (owner_id = private.current_workspace_owner());
DROP POLICY IF EXISTS "team_members_insert_owner" ON public.team_members;
CREATE POLICY "team_members_insert_owner" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (owner_id = private.current_workspace_owner() AND private.is_workspace_owner());
DROP POLICY IF EXISTS "team_members_update_owner" ON public.team_members;
CREATE POLICY "team_members_update_owner" ON public.team_members FOR UPDATE TO authenticated
  USING (owner_id = private.current_workspace_owner() AND private.is_workspace_owner())
  WITH CHECK (owner_id = private.current_workspace_owner() AND private.is_workspace_owner());
DROP POLICY IF EXISTS "team_members_delete_owner" ON public.team_members;
CREATE POLICY "team_members_delete_owner" ON public.team_members FOR DELETE TO authenticated
  USING (owner_id = private.current_workspace_owner() AND private.is_workspace_owner());

-- client_files
DROP POLICY IF EXISTS "client_files_select_workspace" ON public.client_files;
CREATE POLICY "client_files_select_workspace" ON public.client_files FOR SELECT TO authenticated
  USING (user_id = private.current_workspace_owner());
DROP POLICY IF EXISTS "client_files_insert_manager" ON public.client_files;
CREATE POLICY "client_files_insert_manager" ON public.client_files FOR INSERT TO authenticated
  WITH CHECK (user_id = private.current_workspace_owner() AND private.is_workspace_manager());
DROP POLICY IF EXISTS "client_files_delete_manager" ON public.client_files;
CREATE POLICY "client_files_delete_manager" ON public.client_files FOR DELETE TO authenticated
  USING (user_id = private.current_workspace_owner() AND private.is_workspace_manager());

-- activity_logs
DROP POLICY IF EXISTS "activity_logs_select_workspace" ON public.activity_logs;
CREATE POLICY "activity_logs_select_workspace" ON public.activity_logs FOR SELECT TO authenticated
  USING (workspace_id = private.current_workspace_owner());
DROP POLICY IF EXISTS "activity_logs_insert_workspace" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_workspace" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (workspace_id = private.current_workspace_owner() AND user_id = (SELECT auth.uid()));

-- storage: client-files workspace policies
DROP POLICY IF EXISTS "client_files_read_workspace" ON storage.objects;
CREATE POLICY "client_files_read_workspace" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-files' AND (storage.foldername(name))[1] = private.current_workspace_owner()::text);
DROP POLICY IF EXISTS "client_files_insert_manager" ON storage.objects;
CREATE POLICY "client_files_insert_manager" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-files' AND (storage.foldername(name))[1] = private.current_workspace_owner()::text AND private.is_workspace_manager());
DROP POLICY IF EXISTS "client_files_update_manager" ON storage.objects;
CREATE POLICY "client_files_update_manager" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'client-files' AND (storage.foldername(name))[1] = private.current_workspace_owner()::text AND private.is_workspace_manager())
  WITH CHECK (bucket_id = 'client-files' AND (storage.foldername(name))[1] = private.current_workspace_owner()::text AND private.is_workspace_manager());
DROP POLICY IF EXISTS "client_files_delete_manager" ON storage.objects;
CREATE POLICY "client_files_delete_manager" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-files' AND (storage.foldername(name))[1] = private.current_workspace_owner()::text AND private.is_workspace_manager());

-- 6. Drop now-unused public helper functions ------------------------------
DROP FUNCTION IF EXISTS public.current_workspace_owner();
DROP FUNCTION IF EXISTS public.is_workspace_manager();
DROP FUNCTION IF EXISTS public.is_workspace_owner();
DROP FUNCTION IF EXISTS public.get_workspace_owner_id(UUID);
