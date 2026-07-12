-- User flows v1: claims, duplicate groups, RC brand merges

-- Project RC claim / verification
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rc_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rc_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_claimed_by ON public.projects(claimed_by)
  WHERE claimed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_rc_verified_at ON public.projects(rc_verified_at)
  WHERE rc_verified_at IS NOT NULL;

-- RC brand merge (mirror projects.merged_into)
ALTER TABLE public.rc_brands
  ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES public.rc_brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rc_brands_merged_into ON public.rc_brands(merged_into)
  WHERE merged_into IS NOT NULL;

-- Duplicate report groups (multi-entity)
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

-- Authenticated users can insert duplicate reports
DROP POLICY IF EXISTS duplicate_report_groups_insert ON public.duplicate_report_groups;
CREATE POLICY duplicate_report_groups_insert ON public.duplicate_report_groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Users can read their own reports; admins read all (via service role / is_admin in app)
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

GRANT SELECT, INSERT ON public.duplicate_report_groups TO authenticated;
GRANT UPDATE ON public.duplicate_report_groups TO authenticated;
