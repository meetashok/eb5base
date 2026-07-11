-- Project images: table, cover reference, storage bucket, and RLS.

CREATE TABLE IF NOT EXISTS public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0 CHECK (sort_order >= 0 AND sort_order <= 9),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_images_project_id_idx ON public.project_images (project_id);
CREATE UNIQUE INDEX IF NOT EXISTS project_images_project_sort_unique
  ON public.project_images (project_id, sort_order);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cover_image_id UUID REFERENCES public.project_images(id) ON DELETE SET NULL;

-- Verified RC rep for a project (brand entities + legacy rc_id).
CREATE OR REPLACE FUNCTION public.can_manage_project_images(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = TRUE
  )
  OR EXISTS (
    SELECT 1
    FROM public.projects pr
    JOIN public.regional_centers rc ON rc.id = pr.rc_id OR rc.brand_id = pr.brand_id
    JOIN public.rc_memberships m ON m.rc_id = rc.id
    WHERE pr.id = p_project_id
      AND m.user_id = auth.uid()
      AND m.active = TRUE
      AND m.verified_at IS NOT NULL
      AND m.revoked_at IS NULL
  );
$$;

ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_images public read" ON public.project_images;
CREATE POLICY "project_images public read"
  ON public.project_images FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "project_images managers insert" ON public.project_images;
CREATE POLICY "project_images managers insert"
  ON public.project_images FOR INSERT
  WITH CHECK (public.can_manage_project_images(project_id));

DROP POLICY IF EXISTS "project_images managers update" ON public.project_images;
CREATE POLICY "project_images managers update"
  ON public.project_images FOR UPDATE
  USING (public.can_manage_project_images(project_id))
  WITH CHECK (public.can_manage_project_images(project_id));

DROP POLICY IF EXISTS "project_images managers delete" ON public.project_images;
CREATE POLICY "project_images managers delete"
  ON public.project_images FOR DELETE
  USING (public.can_manage_project_images(project_id));

GRANT SELECT ON public.project_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_images TO authenticated;

-- Enforce max 10 images per project.
CREATE OR REPLACE FUNCTION public.enforce_project_image_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.project_images WHERE project_id = NEW.project_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per project';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_images_limit_trigger ON public.project_images;
CREATE TRIGGER project_images_limit_trigger
  BEFORE INSERT ON public.project_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_image_limit();

-- Keep projects.cover_image_id in sync when first image is added or cover is removed.
CREATE OR REPLACE FUNCTION public.sync_project_cover_image()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.projects
    SET cover_image_id = (
      SELECT id FROM public.project_images
      WHERE project_id = OLD.project_id
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 1
    )
    WHERE id = OLD.project_id AND cover_image_id = OLD.id;
    RETURN OLD;
  END IF;

  UPDATE public.projects
  SET cover_image_id = COALESCE(
    cover_image_id,
    (SELECT id FROM public.project_images WHERE id = NEW.id)
  )
  WHERE id = NEW.project_id AND cover_image_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_images_cover_sync_insert ON public.project_images;
CREATE TRIGGER project_images_cover_sync_insert
  AFTER INSERT ON public.project_images
  FOR EACH ROW EXECUTE FUNCTION public.sync_project_cover_image();

DROP TRIGGER IF EXISTS project_images_cover_sync_delete ON public.project_images;
CREATE TRIGGER project_images_cover_sync_delete
  AFTER DELETE ON public.project_images
  FOR EACH ROW EXECUTE FUNCTION public.sync_project_cover_image();

-- Supabase Storage bucket (public read).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  TRUE,
  524288,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "project_images storage public read" ON storage.objects;
CREATE POLICY "project_images storage public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "project_images storage managers insert" ON storage.objects;
CREATE POLICY "project_images storage managers insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images'
    AND public.can_manage_project_images((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "project_images storage managers update" ON storage.objects;
CREATE POLICY "project_images storage managers update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-images'
    AND public.can_manage_project_images((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "project_images storage managers delete" ON storage.objects;
CREATE POLICY "project_images storage managers delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-images'
    AND public.can_manage_project_images((storage.foldername(name))[1]::uuid)
  );
