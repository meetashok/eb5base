-- Profile type selection fix: no default role on signup, backfill mis-assigned accounts,
-- and allow users to deactivate RC memberships when changing profile type.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agent';

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- New signups: leave role unset until onboarding completes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, profile_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  RETURN NEW;
END;
$$;

-- Reset accounts auto-assigned investor without completing onboarding
UPDATE public.profiles
SET role = NULL, profile_completed = FALSE, investor_stage = NULL
WHERE role = 'investor'
  AND investor_stage IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.rc_memberships m
    WHERE m.user_id = profiles.id AND m.active = TRUE
  );

DROP POLICY IF EXISTS "Users can request RC membership" ON public.rc_memberships;
CREATE POLICY "Users can request RC membership"
  ON public.rc_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND verified_at IS NULL);

GRANT UPDATE ON TABLE public.rc_memberships TO authenticated;

DROP POLICY IF EXISTS "Users can deactivate own RC membership" ON public.rc_memberships;
CREATE POLICY "Users can deactivate own RC membership"
  ON public.rc_memberships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
