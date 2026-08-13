-- I-526 explorer short share links (Analysis)
-- Apply in Supabase SQL Editor. Idempotent.

CREATE TABLE IF NOT EXISTS public.i526_shares (
  id text PRIMARY KEY,
  view text NOT NULL CHECK (view IN ('trend', 'throughput', 'data')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS i526_shares_created_at_idx
  ON public.i526_shares (created_at DESC);

ALTER TABLE public.i526_shares ENABLE ROW LEVEL SECURITY;

-- Public read so OG image routes and shared pages can resolve payloads.
DROP POLICY IF EXISTS i526_shares_public_read ON public.i526_shares;
CREATE POLICY i526_shares_public_read ON public.i526_shares
  FOR SELECT
  USING (true);

-- Public create: Share button mints rows via the Next API (anon key fallback).
DROP POLICY IF EXISTS i526_shares_public_insert ON public.i526_shares;
CREATE POLICY i526_shares_public_insert ON public.i526_shares
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.i526_shares TO anon, authenticated;
GRANT ALL ON public.i526_shares TO service_role;

COMMENT ON TABLE public.i526_shares IS
  'Short-lived share snapshots for I-526 explorer filter state (/analysis/i526/s/{id}).';
