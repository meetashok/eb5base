-- Allow public waitlist inserts via anon key (no service role required).
-- Safe to re-run after 20260810_case_tracker_waitlist.sql.

GRANT INSERT ON TABLE public.case_tracker_waitlist TO anon, authenticated;

DROP POLICY IF EXISTS case_tracker_waitlist_insert_public ON public.case_tracker_waitlist;
CREATE POLICY case_tracker_waitlist_insert_public ON public.case_tracker_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
