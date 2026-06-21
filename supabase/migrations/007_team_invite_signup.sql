-- Studioflow — Phase 6
-- Team invite signup: link invited users to workspace on registration

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation RECORD;
BEGIN
  SELECT tm.id, tm.owner_id, tm.role
  INTO invitation
  FROM public.team_members tm
  WHERE lower(tm.email) = lower(NEW.email)
    AND tm.user_id IS NULL
  ORDER BY tm.created_at ASC
  LIMIT 1;

  IF invitation IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, owner_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      invitation.role,
      invitation.owner_id
    );

    UPDATE public.team_members
    SET user_id = NEW.id
    WHERE id = invitation.id;
  ELSE
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      'Owner'
    );

    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'Free', 'Active');
  END IF;

  RETURN NEW;
END;
$$;
