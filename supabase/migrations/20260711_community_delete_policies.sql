-- Allow authenticated users to delete projects and RC brands (community wiki).
-- Also needed for cleaning related rows before delete.

GRANT DELETE ON public.projects TO authenticated;
GRANT DELETE ON public.rc_brands TO authenticated;
GRANT DELETE ON public.project_contacts TO authenticated;
GRANT DELETE ON public.project_votes TO authenticated;
GRANT DELETE ON public.rc_brand_contacts TO authenticated;
GRANT DELETE ON public.duplicate_reports TO authenticated;
GRANT UPDATE ON public.projects TO authenticated;
GRANT UPDATE ON public.regional_centers TO authenticated;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rc_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;
CREATE POLICY "Authenticated users can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete RC brands" ON public.rc_brands;
CREATE POLICY "Authenticated users can delete RC brands"
  ON public.rc_brands FOR DELETE
  TO authenticated
  USING (true);

-- Contacts / votes (ignore errors if tables use different policy names)
DROP POLICY IF EXISTS "Authenticated users can delete project contacts" ON public.project_contacts;
CREATE POLICY "Authenticated users can delete project contacts"
  ON public.project_contacts FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete project votes" ON public.project_votes;
CREATE POLICY "Authenticated users can delete project votes"
  ON public.project_votes FOR DELETE
  TO authenticated
  USING (true);
