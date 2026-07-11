-- Approval workflow: admin flag, rejection reasons, edit submissions queue.
-- Run in Supabase SQL Editor after rc_brands / projects exist.

-- 1. Platform admins
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Who submitted brands + rejection reasons on live entities (for creates)
ALTER TABLE public.rc_brands
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.rc_brands
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Ensure status columns exist
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.rc_brands
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. Edit / create submission queue (edits store proposed payload; creates mirror entity)
CREATE TABLE IF NOT EXISTS public.content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'rc_brand')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_submissions_status_idx
  ON public.content_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_submissions_submitter_idx
  ON public.content_submissions (submitted_by, created_at DESC);
CREATE INDEX IF NOT EXISTS content_submissions_entity_idx
  ON public.content_submissions (entity_type, entity_id);

-- 4. Grants
GRANT SELECT, INSERT ON public.content_submissions TO authenticated;
GRANT UPDATE ON public.content_submissions TO authenticated;
GRANT SELECT ON public.content_submissions TO anon;

-- 5. RLS
ALTER TABLE public.content_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Submitters and admins can view submissions" ON public.content_submissions;
CREATE POLICY "Submitters and admins can view submissions"
  ON public.content_submissions FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.content_submissions;
CREATE POLICY "Authenticated users can create submissions"
  ON public.content_submissions FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Admins can update submissions" ON public.content_submissions;
CREATE POLICY "Admins can update submissions"
  ON public.content_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Submitters can see their own pending/rejected entities on public tables
-- (listing filters still hide pending from everyone else in the app layer)

-- Make yourself admin (edit email first):
-- UPDATE public.profiles SET is_admin = TRUE WHERE email = 'you@example.com';
