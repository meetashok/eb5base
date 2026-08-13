-- ---------------------------------------------------------------------------
-- analysis/i526 Phase 1: USCIS quarterly I-526 filings + throughput data
-- Dataset A (FILINGS_COUNTRY_TEA): I-526/I-526E filings by country × TEA category
-- Dataset B (ALL_FORMS_SUMMARY):  I-526/I-526E/I-829/I-956 throughput & processing
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.i526_releases (
  id serial PRIMARY KEY,
  dataset text NOT NULL CHECK (dataset IN ('FILINGS_COUNTRY_TEA', 'ALL_FORMS_SUMMARY')),
  as_of_quarter char(7) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  published_date date,
  source_url text NOT NULL,
  source_title text NOT NULL,
  source_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset, as_of_quarter)
);

CREATE TABLE IF NOT EXISTS public.i526_filing_cells (
  id bigserial PRIMARY KEY,
  release_id integer NOT NULL REFERENCES public.i526_releases(id) ON DELETE CASCADE,
  country text NOT NULL,
  form_type text NOT NULL CHECK (form_type IN ('I526','I526E','COMBINED')),
  tea_category text NOT NULL CHECK (tea_category IN (
    'RURAL','HIGH_UNEMPLOYMENT','INFRASTRUCTURE',
    'UNRESERVED','DIRECT','PRE_RIA_UNKNOWN','OTHER'
  )),
  receipt_year smallint,
  receipt_quarter smallint CHECK (receipt_quarter BETWEEN 1 AND 4),
  receipt_month smallint CHECK (receipt_month BETWEEN 1 AND 12),
  count integer CHECK (count IS NULL OR count >= 0),
  suppressed boolean NOT NULL DEFAULT false,
  UNIQUE (release_id, country, form_type, tea_category, receipt_year, receipt_quarter, receipt_month)
);

CREATE INDEX IF NOT EXISTS i526_filing_cells_release_idx
  ON public.i526_filing_cells(release_id, country, tea_category, form_type);
CREATE INDEX IF NOT EXISTS i526_filing_cells_cohort_idx
  ON public.i526_filing_cells(country, tea_category, receipt_year, receipt_quarter);

CREATE TABLE IF NOT EXISTS public.i526_processing_summary (
  id bigserial PRIMARY KEY,
  release_id integer NOT NULL REFERENCES public.i526_releases(id) ON DELETE CASCADE,
  form_type text NOT NULL CHECK (form_type IN (
    'I526_LEGACY_PRE_RIA','I526_STANDALONE','I526E',
    'I829','I956','I956F','I956G','I956H','I956K'
  )),
  q_receipts integer CHECK (q_receipts IS NULL OR q_receipts >= 0),
  q_approvals integer CHECK (q_approvals IS NULL OR q_approvals >= 0),
  q_denials integer CHECK (q_denials IS NULL OR q_denials >= 0),
  q_completions integer CHECK (q_completions IS NULL OR q_completions >= 0),
  ytd_receipts integer CHECK (ytd_receipts IS NULL OR ytd_receipts >= 0),
  ytd_approvals integer CHECK (ytd_approvals IS NULL OR ytd_approvals >= 0),
  pending integer CHECK (pending IS NULL OR pending >= 0),
  suppressed_q boolean NOT NULL DEFAULT false,
  median_processing_months numeric(4,1) CHECK (median_processing_months IS NULL OR median_processing_months >= 0),
  UNIQUE (release_id, form_type)
);

-- ---------------------------------------------------------------------------
-- RLS + public read grants (all writes go through service_role)
-- ---------------------------------------------------------------------------
ALTER TABLE public.i526_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i526_filing_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i526_processing_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS i526_releases_public_read ON public.i526_releases;
CREATE POLICY i526_releases_public_read ON public.i526_releases FOR SELECT USING (true);

DROP POLICY IF EXISTS i526_filing_cells_public_read ON public.i526_filing_cells;
CREATE POLICY i526_filing_cells_public_read ON public.i526_filing_cells FOR SELECT USING (true);

DROP POLICY IF EXISTS i526_processing_public_read ON public.i526_processing_summary;
CREATE POLICY i526_processing_public_read ON public.i526_processing_summary FOR SELECT USING (true);

GRANT SELECT ON public.i526_releases, public.i526_filing_cells,
                  public.i526_processing_summary
  TO anon, authenticated;
