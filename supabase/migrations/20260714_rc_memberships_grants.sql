-- Fix rc_memberships table access for authenticated users (SELECT/INSERT/UPDATE).

GRANT SELECT, INSERT, UPDATE ON TABLE public.rc_memberships TO authenticated;

ALTER TABLE public.rc_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own RC memberships" ON public.rc_memberships;
CREATE POLICY "Users can view own RC memberships"
  ON public.rc_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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
