-- Short share links for the Visa Bulletin explorer (/analysis/visa-bulletin/s/{id}).
-- Public read (resolve shared views) + public insert (Share button mints rows).

CREATE TABLE IF NOT EXISTS public.visa_bulletin_shares (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visa_bulletin_shares_created_at_idx
  ON public.visa_bulletin_shares (created_at DESC);

ALTER TABLE public.visa_bulletin_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visa_bulletin_shares_public_read ON public.visa_bulletin_shares;
CREATE POLICY visa_bulletin_shares_public_read ON public.visa_bulletin_shares
  FOR SELECT USING (true);

DROP POLICY IF EXISTS visa_bulletin_shares_public_insert ON public.visa_bulletin_shares;
CREATE POLICY visa_bulletin_shares_public_insert ON public.visa_bulletin_shares
  FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.visa_bulletin_shares TO anon, authenticated;
GRANT ALL ON public.visa_bulletin_shares TO service_role;
