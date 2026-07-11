-- Readable URL slugs for brands and projects.
-- Run in Supabase SQL Editor after rc_brands exists.

ALTER TABLE public.rc_brands ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug TEXT;

-- Drop older global project slug index if present (replaced by per-brand uniqueness)
DROP INDEX IF EXISTS public.projects_slug_unique;

-- Brands: globally unique when present
CREATE UNIQUE INDEX IF NOT EXISTS rc_brands_slug_unique
  ON public.rc_brands (slug)
  WHERE slug IS NOT NULL;

-- Projects: unique per brand (nested URLs); unique globally when no brand
CREATE UNIQUE INDEX IF NOT EXISTS projects_brand_slug_unique
  ON public.projects (brand_id, slug)
  WHERE slug IS NOT NULL AND brand_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique_no_brand
  ON public.projects (slug)
  WHERE slug IS NOT NULL AND brand_id IS NULL;

-- Backfill brands from name (basic slugify in SQL)
UPDATE public.rc_brands
SET slug = trim(both '-' from lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')))
WHERE slug IS NULL AND name IS NOT NULL AND name <> '';

-- Avoid reserved brand slugs
UPDATE public.rc_brands
SET slug = slug || '-rc'
WHERE slug IN ('new', 'edit', 'projects', 'rc');

-- Backfill projects from name
UPDATE public.projects
SET slug = trim(both '-' from lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')))
WHERE slug IS NULL AND name IS NOT NULL AND name <> '';

UPDATE public.projects
SET slug = slug || '-rc'
WHERE slug IN ('new', 'edit', 'projects', 'rc');

-- Resolve brand slug collisions by appending short id suffix
WITH dups AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM public.rc_brands
  WHERE slug IS NOT NULL
)
UPDATE public.rc_brands b
SET slug = b.slug || '-' || substr(replace(b.id::text, '-', ''), 1, 6)
FROM dups d
WHERE b.id = d.id AND d.rn > 1;

-- Resolve project slug collisions within the same brand
WITH dups AS (
  SELECT id, slug, brand_id,
         ROW_NUMBER() OVER (PARTITION BY brand_id, slug ORDER BY created_at) AS rn
  FROM public.projects
  WHERE slug IS NOT NULL AND brand_id IS NOT NULL
)
UPDATE public.projects p
SET slug = p.slug || '-' || substr(replace(p.id::text, '-', ''), 1, 6)
FROM dups d
WHERE p.id = d.id AND d.rn > 1;

-- Resolve unbranded project slug collisions
WITH dups AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM public.projects
  WHERE slug IS NOT NULL AND brand_id IS NULL
)
UPDATE public.projects p
SET slug = p.slug || '-' || substr(replace(p.id::text, '-', ''), 1, 6)
FROM dups d
WHERE p.id = d.id AND d.rn > 1;
