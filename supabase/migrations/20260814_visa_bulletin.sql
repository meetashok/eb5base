-- Visa Bulletin employment-based cut-off dates over time.
-- Source: U.S. Department of State monthly Visa Bulletin (travel.state.gov).
-- Ingested by scripts/visa-bulletin/ingest.mjs (parser: scripts/visa-bulletin/parse.mjs).
-- All employment categories (EB1-EB5) are stored; EB-5 is split into
-- Unreserved + the RIA set-asides (Rural / High Unemployment / Infrastructure).
-- Public read, service_role write (same convention as the i485/i526 tables).

CREATE TABLE IF NOT EXISTS public.visa_bulletin_releases (
  id serial PRIMARY KEY,
  bulletin_month date NOT NULL UNIQUE,   -- first day of the bulletin's month
  fiscal_year integer,
  published_date date,
  source_url text NOT NULL,
  source_title text,
  scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visa_bulletin_dates (
  id bigserial PRIMARY KEY,
  release_id integer NOT NULL REFERENCES public.visa_bulletin_releases(id) ON DELETE CASCADE,
  preference text NOT NULL CHECK (preference IN ('EB1', 'EB2', 'EB3', 'EB4', 'EB5')),
  -- Canonical sub-category (NOT NULL so the UNIQUE constraint is reliable):
  --   EB1/EB2/EB4: MAIN; EB3: PROFESSIONAL_SKILLED | OTHER_WORKERS;
  --   EB4: MAIN | RELIGIOUS_WORKERS;
  --   EB5: UNRESERVED | RURAL | HIGH_UNEMPLOYMENT | INFRASTRUCTURE | REGIONAL_CENTER
  subcategory text NOT NULL,
  country text NOT NULL CHECK (country IN ('WORLDWIDE', 'CHINA', 'INDIA', 'MEXICO', 'PHILIPPINES', 'VIETNAM')),
  date_type text NOT NULL CHECK (date_type IN ('FINAL_ACTION', 'FILING')),
  status text NOT NULL CHECK (status IN ('DATE', 'CURRENT', 'UNAVAILABLE')),
  cutoff_date date,   -- non-null only when status = 'DATE'
  UNIQUE (release_id, preference, subcategory, country, date_type)
);

CREATE INDEX IF NOT EXISTS visa_bulletin_dates_lookup
  ON public.visa_bulletin_dates (preference, subcategory, country, date_type);

ALTER TABLE public.visa_bulletin_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_bulletin_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visa_bulletin_releases_read ON public.visa_bulletin_releases;
CREATE POLICY visa_bulletin_releases_read ON public.visa_bulletin_releases FOR SELECT USING (true);

DROP POLICY IF EXISTS visa_bulletin_dates_read ON public.visa_bulletin_dates;
CREATE POLICY visa_bulletin_dates_read ON public.visa_bulletin_dates FOR SELECT USING (true);

GRANT SELECT ON public.visa_bulletin_releases TO anon, authenticated;
GRANT SELECT ON public.visa_bulletin_dates TO anon, authenticated;
-- service_role needs SELECT too (PostgREST insert ... returning / .select()).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_bulletin_releases TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_bulletin_dates TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.visa_bulletin_releases_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.visa_bulletin_dates_id_seq TO service_role;
