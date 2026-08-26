-- USCIS Form I-485 employment-based pending inventory (Analysis section)
-- Apply in Supabase SQL Editor. Idempotent where practical.
--
-- Source: "Pending Applications for Employment-Based Preference Categories"
-- monthly XLSX reports on the USCIS Immigration and Citizenship Data page.
-- Raw workbooks + provenance live in the repo under data/uscis-i485/.
-- Loaded by scripts/analysis/ingest-i485.mjs (service role).

-- ---------------------------------------------------------------------------
-- i485_releases: one row per USCIS snapshot (as-of date)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.i485_releases (
  id serial PRIMARY KEY,
  as_of_date date NOT NULL UNIQUE,
  published_date date,
  source_url text NOT NULL,
  source_title text NOT NULL,
  source_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- i485_inventory_cells: one row per non-zero cell of the report matrix
--   country x category x visa status x priority-date month x priority-date year
-- Zero cells ("-" in the workbook) are omitted; absence means zero.
-- pd_year = 0 encodes the "Prior Years" rollup bucket.
-- count IS NULL + suppressed = true encodes "D" (under 10, not disclosed).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.i485_inventory_cells (
  id bigserial PRIMARY KEY,
  release_id integer NOT NULL REFERENCES public.i485_releases(id) ON DELETE CASCADE,
  country text NOT NULL CHECK (country IN (
    'rest_of_world', 'china', 'india', 'mexico', 'philippines'
  )),
  category text NOT NULL CHECK (category IN (
    'EB1', 'EB2', 'EB3', 'EW3', 'EB4', 'CRW',
    'EB5_UNRESERVED', 'EB5_SET_ASIDE', 'EB5_RURAL',
    'EB5_HIGH_UNEMPLOYMENT', 'EB5_INFRASTRUCTURE'
  )),
  visa_status text NOT NULL CHECK (visa_status IN ('available', 'awaiting')),
  pd_year smallint NOT NULL CHECK (pd_year = 0 OR pd_year BETWEEN 1990 AND 2100),
  pd_month smallint NOT NULL CHECK (pd_month BETWEEN 1 AND 12),
  count integer CHECK (count IS NULL OR count >= 0),
  suppressed boolean NOT NULL DEFAULT false,
  UNIQUE (release_id, country, category, visa_status, pd_year, pd_month)
);

CREATE INDEX IF NOT EXISTS i485_cells_release_idx
  ON public.i485_inventory_cells(release_id, country, category);
CREATE INDEX IF NOT EXISTS i485_cells_cohort_idx
  ON public.i485_inventory_cells(country, category, pd_year, pd_month);

-- ---------------------------------------------------------------------------
-- RLS: public read-only; writes via service role only
-- ---------------------------------------------------------------------------
ALTER TABLE public.i485_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i485_inventory_cells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS i485_releases_public_read ON public.i485_releases;
CREATE POLICY i485_releases_public_read ON public.i485_releases
  FOR SELECT USING (true);

DROP POLICY IF EXISTS i485_cells_public_read ON public.i485_inventory_cells;
CREATE POLICY i485_cells_public_read ON public.i485_inventory_cells
  FOR SELECT USING (true);

GRANT SELECT ON public.i485_releases TO anon, authenticated;
GRANT SELECT ON public.i485_inventory_cells TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.i485_releases TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.i485_inventory_cells TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.i485_releases_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.i485_inventory_cells_id_seq TO service_role;
