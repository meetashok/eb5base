-- Reliable RC membership access: table grants + SECURITY DEFINER RPCs.
-- Run in Supabase SQL Editor if "permission denied for table rc_memberships" persists.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rc_memberships TO authenticated;

ALTER TABLE public.rc_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own RC memberships" ON public.rc_memberships;
CREATE POLICY "Users can view own RC memberships"
  ON public.rc_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all RC memberships" ON public.rc_memberships;
CREATE POLICY "Admins can view all RC memberships"
  ON public.rc_memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can request RC membership" ON public.rc_memberships;
CREATE POLICY "Users can request RC membership"
  ON public.rc_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND verified_at IS NULL);

DROP POLICY IF EXISTS "Users can deactivate own RC membership" ON public.rc_memberships;
CREATE POLICY "Users can deactivate own RC membership"
  ON public.rc_memberships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can verify RC memberships" ON public.rc_memberships;
CREATE POLICY "Admins can verify RC memberships"
  ON public.rc_memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE OR REPLACE FUNCTION public.deactivate_own_rc_memberships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.rc_memberships
  SET active = FALSE
  WHERE user_id = auth.uid() AND active = TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_rc_membership(p_rc_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rc_id IS NULL THEN
    RAISE EXCEPTION 'Regional center is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.regional_centers WHERE id = p_rc_id) THEN
    RAISE EXCEPTION 'Regional center not found';
  END IF;

  UPDATE public.rc_memberships
  SET active = FALSE
  WHERE user_id = auth.uid() AND active = TRUE;

  INSERT INTO public.rc_memberships (rc_id, user_id, role, active, verified_at)
  VALUES (p_rc_id, auth.uid(), 'editor', TRUE, NULL)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_own_rc_memberships() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_rc_membership(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_own_rc_memberships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_rc_membership(uuid) TO authenticated;
