-- Studioflow — Phase 2 / Migration 003
-- Helper functions, RLS helpers, signup trigger (DB §5)

-- 5.1 Workspace owner resolution ------------------------------------------
-- Returns the workspace owner id for a given user (owner_id if member, self if owner).
-- SECURITY DEFINER so RLS policies can call it without recursing into profiles RLS.
CREATE OR REPLACE FUNCTION public.get_workspace_owner_id(uid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.profiles WHERE id = uid),
    uid
  );
$$;

-- Convenience wrapper scoped to the current authenticated user.
CREATE OR REPLACE FUNCTION public.current_workspace_owner()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_workspace_owner_id((SELECT auth.uid()));
$$;

-- Current user's role within the workspace.
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

-- True when the current user can manage CRM data (Owner or Manager).
CREATE OR REPLACE FUNCTION public.is_workspace_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('Owner', 'Manager')
  );
$$;

-- True when the current user is the workspace Owner.
CREATE OR REPLACE FUNCTION public.is_workspace_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'Owner'
  );
$$;

-- 5.2 Auto-create profile + Free subscription on signup -------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'Owner'
  );

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'Free', 'Active');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5.3 Invoice overdue check (optional cron) -------------------------------
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.invoices
  SET status = 'Overdue'
  WHERE status = 'Pending'
    AND due_date < CURRENT_DATE;
$$;
