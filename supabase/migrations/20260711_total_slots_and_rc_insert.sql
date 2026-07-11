-- Run in Supabase SQL Editor before deploying remaining features.

-- 1. Total investor slots on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_slots INTEGER;

-- 2. Allow authenticated users to create regional centers
DROP POLICY IF EXISTS "Authenticated users can add regional centers" ON regional_centers;
CREATE POLICY "Authenticated users can add regional centers"
  ON regional_centers FOR INSERT
  TO authenticated
  WITH CHECK (true);
