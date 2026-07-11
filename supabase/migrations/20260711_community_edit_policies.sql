-- Allow authenticated users to update projects (community wiki edits).
-- Brands already have an equivalent UPDATE policy.

GRANT UPDATE ON public.projects TO authenticated;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
CREATE POLICY "Authenticated users can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure brand UPDATE policy exists (idempotent with grants fix)
GRANT UPDATE ON public.rc_brands TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can update RC brands" ON public.rc_brands;
CREATE POLICY "Authenticated users can update RC brands"
  ON public.rc_brands FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
