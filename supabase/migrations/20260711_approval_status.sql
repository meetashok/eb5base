-- Approval-queue status columns (Section 1 of master remaining work).
-- Run in Supabase SQL Editor AFTER relying on status filters in the app.
-- Prerequisite: rc_brands exists (seed-rc-data.sql / 20260711_rc_brands_schema.sql).

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_slots INTEGER;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.rc_brands ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Existing rows are trusted / already live
UPDATE public.projects
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

UPDATE public.rc_brands
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects (status);
CREATE INDEX IF NOT EXISTS rc_brands_status_idx ON public.rc_brands (status);
