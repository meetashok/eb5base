-- Case Tracker public waitlist (email notify list)
-- Apply in Supabase SQL Editor. Idempotent.

CREATE TABLE IF NOT EXISTS public.case_tracker_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_normalized text NOT NULL,
  source text NOT NULL DEFAULT 'unknown'
    CHECK (source IN ('home', 'tracker', 'unknown')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT case_tracker_waitlist_email_normalized_key UNIQUE (email_normalized)
);

CREATE INDEX IF NOT EXISTS case_tracker_waitlist_created_at_idx
  ON public.case_tracker_waitlist (created_at DESC);

ALTER TABLE public.case_tracker_waitlist ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: inserts go through service role via /api/waitlist only.
GRANT ALL ON TABLE public.case_tracker_waitlist TO service_role;

COMMENT ON TABLE public.case_tracker_waitlist IS
  'Opt-in emails for Case Tracker launch notify. One row per normalized email.';
