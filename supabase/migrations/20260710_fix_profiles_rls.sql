-- Fix profiles table access for authenticated users (and public reads).
-- "permission denied for table profiles" usually means missing GRANTs and/or RLS policies.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT UPDATE ON TABLE public.profiles TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public profile fields (project "added by", confirmation lists, etc.)
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
CREATE POLICY "Public profiles are viewable"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (show_profile_public = true OR auth.uid() = id);

-- Allow authenticated users to read any profile row needed for directory joins
-- (display names on projects). Tighten later if you want stricter privacy.
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Ensure new-user trigger can still insert (SECURITY DEFINER owner usually bypasses RLS,
-- but grant INSERT to the function owner path is already covered. Keep INSERT locked down.)
-- No INSERT policy for authenticated — profiles are created only by handle_new_user.
