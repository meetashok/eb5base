-- Schema for RC Brands model.
-- Run AFTER (or with) seed-rc-data.sql if that file also creates these tables.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

-- Brands (user-facing regional center organizations)
CREATE TABLE IF NOT EXISTS public.rc_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rc_brands_name_lower_idx
  ON public.rc_brands (lower(name));

-- Contacts on brands
CREATE TABLE IF NOT EXISTS public.rc_brand_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.rc_brands(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rc_brand_contacts_brand_id_idx
  ON public.rc_brand_contacts (brand_id);

-- Link USCIS entities → brands
ALTER TABLE public.regional_centers
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.rc_brands(id);

CREATE INDEX IF NOT EXISTS regional_centers_brand_id_idx
  ON public.regional_centers (brand_id);

-- Link projects → brands
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.rc_brands(id);

CREATE INDEX IF NOT EXISTS projects_brand_id_idx
  ON public.projects (brand_id);

-- Also ensure total_slots exists
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS total_slots INTEGER;

-- Grants
GRANT SELECT ON public.rc_brands TO anon, authenticated;
GRANT INSERT, UPDATE ON public.rc_brands TO authenticated;
GRANT SELECT ON public.rc_brand_contacts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rc_brand_contacts TO authenticated;

-- RLS
ALTER TABLE public.rc_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rc_brand_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view RC brands" ON public.rc_brands;
CREATE POLICY "Anyone can view RC brands"
  ON public.rc_brands FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add RC brands" ON public.rc_brands;
CREATE POLICY "Authenticated users can add RC brands"
  ON public.rc_brands FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update RC brands" ON public.rc_brands;
CREATE POLICY "Authenticated users can update RC brands"
  ON public.rc_brands FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view brand contacts" ON public.rc_brand_contacts;
CREATE POLICY "Anyone can view brand contacts"
  ON public.rc_brand_contacts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage brand contacts" ON public.rc_brand_contacts;
CREATE POLICY "Authenticated users can manage brand contacts"
  ON public.rc_brand_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
