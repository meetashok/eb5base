-- Fix: permission denied for table rc_brands
-- Run this in Supabase SQL Editor (as postgres / table owner).
-- "permission denied for table" = missing GRANT (not RLS).

-- Schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Brands
GRANT SELECT ON public.rc_brands TO anon, authenticated;
GRANT INSERT, UPDATE ON public.rc_brands TO authenticated;

-- Brand contacts
GRANT SELECT ON public.rc_brand_contacts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rc_brand_contacts TO authenticated;

-- RLS (safe if already enabled)
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

-- Quick check (should return rows if brands were seeded)
-- SELECT id, name FROM public.rc_brands ORDER BY name LIMIT 10;
