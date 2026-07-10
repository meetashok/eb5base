-- Run in Supabase SQL Editor before deploying the onboarding flow.
-- Adds agent role, nullable role default, profile_completed flag, and RC membership insert policy.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agent';

ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Existing accounts stay usable
UPDATE profiles SET profile_completed = TRUE WHERE role IS NOT NULL;

-- New signups: leave role unset until onboarding completes
-- (Adjust the trigger body if your handle_new_user differs.)
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Users can request RC membership" ON rc_memberships;
CREATE POLICY "Users can request RC membership"
  ON rc_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND verified_at IS NULL);
