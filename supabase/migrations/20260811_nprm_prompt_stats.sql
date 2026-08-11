-- NPRM Write tab: aggregate count of browsers that copied a prompt.
-- Apply in Supabase SQL Editor. Idempotent.
-- Deduping is client-side (localStorage); this table stores the public total only.

CREATE TABLE IF NOT EXISTS public.nprm_prompt_stats (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  copy_count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.nprm_prompt_stats (id, copy_count)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.nprm_prompt_stats ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.nprm_prompt_stats TO anon, authenticated;
GRANT ALL ON TABLE public.nprm_prompt_stats TO service_role;

DROP POLICY IF EXISTS nprm_prompt_stats_select_public ON public.nprm_prompt_stats;
CREATE POLICY nprm_prompt_stats_select_public ON public.nprm_prompt_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Atomic increment for API (service_role / security definer).
CREATE OR REPLACE FUNCTION public.increment_nprm_prompt_copies()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.nprm_prompt_stats
  SET copy_count = copy_count + 1,
      updated_at = now()
  WHERE id = 1
  RETURNING copy_count INTO new_count;

  IF new_count IS NULL THEN
    INSERT INTO public.nprm_prompt_stats (id, copy_count)
    VALUES (1, 1)
    ON CONFLICT (id) DO UPDATE
      SET copy_count = public.nprm_prompt_stats.copy_count + 1,
          updated_at = now()
    RETURNING copy_count INTO new_count;
  END IF;

  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_nprm_prompt_copies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_nprm_prompt_copies() TO service_role;
-- Anon may call the SECURITY DEFINER RPC so Vercel can increment without a
-- service-role key (function only bumps the aggregate counter).
GRANT EXECUTE ON FUNCTION public.increment_nprm_prompt_copies() TO anon, authenticated;

COMMENT ON TABLE public.nprm_prompt_stats IS
  'Aggregate NPRM prompt-copy count for public social proof. No PII.';
COMMENT ON FUNCTION public.increment_nprm_prompt_copies() IS
  'Atomically bump nprm_prompt_stats.copy_count; called from /api/nprm/prompt-use.';
