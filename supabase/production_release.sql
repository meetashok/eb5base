-- EB5 Base — production release (investor beta)
-- Run once in Supabase SQL Editor. Safe to re-run (idempotent).
-- Replaces individual migrations listed in docs/DEPLOY_CHECKLIST.md.

BEGIN;

-- =============================================================================
-- 1. Profiles: grants + RLS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT UPDATE ON TABLE public.profiles TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
CREATE POLICY "Public profiles are viewable"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (show_profile_public = true OR auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- 2. Profile onboarding: agent role, nullable role, profile_completed
-- =============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agent';

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Existing accounts with a role stay usable
UPDATE public.profiles
SET profile_completed = TRUE
WHERE role IS NOT NULL AND profile_completed IS DISTINCT FROM TRUE;

-- Reset accounts auto-assigned investor without completing onboarding
UPDATE public.profiles
SET role = NULL, profile_completed = FALSE, investor_stage = NULL
WHERE role = 'investor'
  AND investor_stage IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.rc_memberships m
    WHERE m.user_id = profiles.id AND m.active = TRUE
  );

-- =============================================================================
-- 3. New-user trigger: no default role; Google avatar from picture or avatar_url
-- =============================================================================

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
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    FALSE
  );
  RETURN NEW;
END;
$$;

-- Backfill avatars for existing profiles where Google picture exists in auth metadata
UPDATE public.profiles p
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
FROM auth.users u
WHERE p.id = u.id
  AND (p.avatar_url IS NULL OR p.avatar_url = '')
  AND COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ) IS NOT NULL;

-- =============================================================================
-- 4. User flows v1: claims, duplicate groups, RC brand merges
-- =============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rc_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rc_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_claimed_by ON public.projects(claimed_by)
  WHERE claimed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_rc_verified_at ON public.projects(rc_verified_at)
  WHERE rc_verified_at IS NOT NULL;

ALTER TABLE public.rc_brands
  ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES public.rc_brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rc_brands_merged_into ON public.rc_brands(merged_into)
  WHERE merged_into IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.duplicate_report_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'rc_brand')),
  reported_entity_id UUID NOT NULL,
  duplicate_entity_ids UUID[] NOT NULL DEFAULT '{}',
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  canonical_entity_id UUID,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duplicate_report_groups_status
  ON public.duplicate_report_groups(status);
CREATE INDEX IF NOT EXISTS idx_duplicate_report_groups_reported_by
  ON public.duplicate_report_groups(reported_by);

ALTER TABLE public.duplicate_report_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS duplicate_report_groups_insert ON public.duplicate_report_groups;
CREATE POLICY duplicate_report_groups_insert ON public.duplicate_report_groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS duplicate_report_groups_select_own ON public.duplicate_report_groups;
CREATE POLICY duplicate_report_groups_select_own ON public.duplicate_report_groups
  FOR SELECT TO authenticated
  USING (auth.uid() = reported_by);

DROP POLICY IF EXISTS duplicate_report_groups_admin ON public.duplicate_report_groups;
CREATE POLICY duplicate_report_groups_admin ON public.duplicate_report_groups
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

GRANT SELECT, INSERT, UPDATE ON public.duplicate_report_groups TO authenticated;

-- =============================================================================
-- 5. RC memberships: grants, RLS, SECURITY DEFINER RPCs
-- =============================================================================

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

COMMIT;
