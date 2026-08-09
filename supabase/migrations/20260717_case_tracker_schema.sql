-- Case tracker schema for eb5base v0
-- Apply in Supabase SQL Editor. Idempotent where practical.
-- Directory tables (projects, rc_brands, ...) are intentionally left intact.

-- ---------------------------------------------------------------------------
-- profiles: add case-tracker columns (keep legacy directory columns)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS regional_center_name text,
  ADD COLUMN IF NOT EXISTS classification text
    CHECK (classification IS NULL OR classification IN ('rural', 'hua', 'both')),
  ADD COLUMN IF NOT EXISTS i956f_status text
    CHECK (i956f_status IS NULL OR i956f_status IN ('approved', 'pending', 'unknown')),
  ADD COLUMN IF NOT EXISTS i956f_approval_date date,
  ADD COLUMN IF NOT EXISTS attorney_name text,
  ADD COLUMN IF NOT EXISTS agent_name text,
  ADD COLUMN IF NOT EXISTS notify_mode text NOT NULL DEFAULT 'immediate'
    CHECK (notify_mode IN ('immediate', 'digest')),
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_manual_refresh_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_viewed_timeline_at timestamptz;

-- email_notifications already exists in directory-era schema; ensure default
ALTER TABLE public.profiles
  ALTER COLUMN email_notifications SET DEFAULT true;

-- ---------------------------------------------------------------------------
-- individuals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.individuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS individuals_user_id_idx ON public.individuals(user_id);

ALTER TABLE public.individuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS individuals_select_own ON public.individuals;
CREATE POLICY individuals_select_own ON public.individuals
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS individuals_insert_own ON public.individuals;
CREATE POLICY individuals_insert_own ON public.individuals
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS individuals_update_own ON public.individuals;
CREATE POLICY individuals_update_own ON public.individuals
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS individuals_delete_own ON public.individuals;
CREATE POLICY individuals_delete_own ON public.individuals
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.individuals TO authenticated;
GRANT ALL ON public.individuals TO service_role;

-- ---------------------------------------------------------------------------
-- cases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id uuid NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receipt_number_encrypted text NOT NULL,
  form_type text NOT NULL
    CHECK (form_type IN ('I-526E', 'I-485', 'I-131', 'I-765')),
  service_center text,
  filed_date date,
  current_status text,
  status_updated_at timestamptz,
  last_polled_at timestamptz,
  poll_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cases_user_id_idx ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS cases_individual_id_idx ON public.cases(individual_id);
CREATE INDEX IF NOT EXISTS cases_form_type_idx ON public.cases(form_type);
CREATE INDEX IF NOT EXISTS cases_project_insights_idx ON public.cases(form_type, current_status);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cases_select_own ON public.cases;
CREATE POLICY cases_select_own ON public.cases
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS cases_insert_own ON public.cases;
CREATE POLICY cases_insert_own ON public.cases
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cases_update_own ON public.cases;
CREATE POLICY cases_update_own ON public.cases
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cases_delete_own ON public.cases;
CREATE POLICY cases_delete_own ON public.cases
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;

-- ---------------------------------------------------------------------------
-- case_status_history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  status text NOT NULL,
  status_date date,
  detected_at timestamptz NOT NULL DEFAULT now(),
  notified boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS case_status_history_case_id_idx
  ON public.case_status_history(case_id);

ALTER TABLE public.case_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_status_history_select_own ON public.case_status_history;
CREATE POLICY case_status_history_select_own ON public.case_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id AND c.user_id = auth.uid()
    )
  );

-- Inserts/updates come from service role (poller) or via security definer helpers
GRANT SELECT ON public.case_status_history TO authenticated;
GRANT ALL ON public.case_status_history TO service_role;

-- ---------------------------------------------------------------------------
-- wom_cases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wom_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_form_type text NOT NULL
    CHECK (related_form_type IN ('I-526E', 'I-485', 'I-131', 'I-765')),
  court_district text,
  filed_date date,
  wom_status text NOT NULL
    CHECK (wom_status IN (
      'filed', 'hearing_scheduled', 'decided_favorable',
      'decided_unfavorable', 'settled', 'dismissed'
    )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wom_cases_user_id_idx ON public.wom_cases(user_id);

ALTER TABLE public.wom_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wom_cases_select_own ON public.wom_cases;
CREATE POLICY wom_cases_select_own ON public.wom_cases
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS wom_cases_insert_own ON public.wom_cases;
CREATE POLICY wom_cases_insert_own ON public.wom_cases
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS wom_cases_update_own ON public.wom_cases;
CREATE POLICY wom_cases_update_own ON public.wom_cases
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS wom_cases_delete_own ON public.wom_cases;
CREATE POLICY wom_cases_delete_own ON public.wom_cases
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wom_cases TO authenticated;
GRANT ALL ON public.wom_cases TO service_role;

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL
    CHECK (action IN ('decrypt', 'encrypt', 'delete_account', 'export_data')),
  actor text NOT NULL
    CHECK (actor IN ('system_poller', 'user_session', 'admin')),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON public.audit_log(user_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_select_own ON public.audit_log;
CREATE POLICY audit_log_select_own ON public.audit_log
  FOR SELECT USING (user_id = auth.uid());

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

-- ---------------------------------------------------------------------------
-- Insights RPCs (security definer, aggregated only, min 5 users)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_insights_overall()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
  result jsonb;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO user_count FROM public.cases;

  IF user_count < 5 THEN
    RETURN jsonb_build_object(
      'available', false,
      'user_count', user_count,
      'min_users', 5
    );
  END IF;

  SELECT jsonb_build_object(
    'available', true,
    'user_count', user_count,
    'total_cases', (SELECT COUNT(*) FROM public.cases),
    'by_form', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          form_type,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE current_status ILIKE '%approved%') AS approved,
          COUNT(*) FILTER (
            WHERE current_status IS NOT NULL
              AND current_status NOT ILIKE '%approved%'
              AND current_status NOT ILIKE '%denied%'
              AND current_status NOT ILIKE '%rfe%'
              AND current_status NOT ILIKE '%request for evidence%'
          ) AS pending,
          COUNT(*) FILTER (
            WHERE current_status ILIKE '%rfe%'
               OR current_status ILIKE '%request for evidence%'
          ) AS rfe,
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (COALESCE(status_updated_at, now()) - filed_date::timestamptz)) / 86400.0 / 30.44
            )::numeric,
            1
          ) AS median_months_approx
        FROM public.cases
        WHERE filed_date IS NOT NULL
        GROUP BY form_type
        ORDER BY form_type
      ) t
    ),
    'by_service_center', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT service_center, COUNT(*) AS total
        FROM public.cases
        WHERE service_center IS NOT NULL
        GROUP BY service_center
        ORDER BY total DESC
      ) t
    ),
    'by_classification', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT p.classification, COUNT(DISTINCT p.id) AS users
        FROM public.profiles p
        WHERE p.onboarding_complete = true
          AND p.classification IS NOT NULL
        GROUP BY p.classification
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_insights_by_project(p_project_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
  result jsonb;
BEGIN
  IF p_project_name IS NULL OR length(trim(p_project_name)) = 0 THEN
    RETURN jsonb_build_object('available', false, 'user_count', 0, 'min_users', 5);
  END IF;

  SELECT COUNT(*) INTO user_count
  FROM public.profiles
  WHERE onboarding_complete = true
    AND lower(trim(project_name)) = lower(trim(p_project_name));

  IF user_count < 5 THEN
    RETURN jsonb_build_object(
      'available', false,
      'user_count', user_count,
      'min_users', 5,
      'project_name', p_project_name
    );
  END IF;

  SELECT jsonb_build_object(
    'available', true,
    'user_count', user_count,
    'project_name', p_project_name,
    'by_form', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          c.form_type,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE c.current_status ILIKE '%approved%') AS approved,
          COUNT(*) FILTER (
            WHERE c.current_status IS NOT NULL
              AND c.current_status NOT ILIKE '%approved%'
              AND c.current_status NOT ILIKE '%denied%'
              AND c.current_status NOT ILIKE '%rfe%'
              AND c.current_status NOT ILIKE '%request for evidence%'
          ) AS pending,
          COUNT(*) FILTER (
            WHERE c.current_status ILIKE '%rfe%'
               OR c.current_status ILIKE '%request for evidence%'
          ) AS rfe,
          ROUND(
            percentile_cont(0.5) WITHIN GROUP (
              ORDER BY EXTRACT(EPOCH FROM (COALESCE(c.status_updated_at, now()) - c.filed_date::timestamptz)) / 86400.0 / 30.44
            )::numeric,
            1
          ) AS median_months
        FROM public.cases c
        JOIN public.profiles p ON p.id = c.user_id
        WHERE lower(trim(p.project_name)) = lower(trim(p_project_name))
          AND c.filed_date IS NOT NULL
        GROUP BY c.form_type
        ORDER BY c.form_type
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_insights_by_cohort(p_quarter text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
  result jsonb;
  q text;
BEGIN
  q := p_quarter;

  IF q IS NULL THEN
    SELECT 'Q' || ((EXTRACT(MONTH FROM filed_date)::int - 1) / 3 + 1)::text
           || ' ' || EXTRACT(YEAR FROM filed_date)::text
    INTO q
    FROM public.cases
    WHERE form_type = 'I-526E' AND filed_date IS NOT NULL
    GROUP BY 1
    ORDER BY MIN(filed_date) DESC
    LIMIT 1;
  END IF;

  IF q IS NULL THEN
    RETURN jsonb_build_object('available', false, 'user_count', 0, 'min_users', 5, 'quarters', '[]'::jsonb);
  END IF;

  SELECT COUNT(DISTINCT user_id) INTO user_count
  FROM public.cases
  WHERE form_type = 'I-526E'
    AND filed_date IS NOT NULL
    AND ('Q' || ((EXTRACT(MONTH FROM filed_date)::int - 1) / 3 + 1)::text
         || ' ' || EXTRACT(YEAR FROM filed_date)::text) = q;

  IF user_count < 5 THEN
    RETURN jsonb_build_object(
      'available', false,
      'user_count', user_count,
      'min_users', 5,
      'quarter', q,
      'quarters', (
        SELECT COALESCE(jsonb_agg(quarter ORDER BY quarter DESC), '[]'::jsonb)
        FROM (
          SELECT DISTINCT
            'Q' || ((EXTRACT(MONTH FROM filed_date)::int - 1) / 3 + 1)::text
            || ' ' || EXTRACT(YEAR FROM filed_date)::text AS quarter
          FROM public.cases
          WHERE form_type = 'I-526E' AND filed_date IS NOT NULL
        ) s
      )
    );
  END IF;

  SELECT jsonb_build_object(
    'available', true,
    'user_count', user_count,
    'quarter', q,
    'quarters', (
      SELECT COALESCE(jsonb_agg(quarter ORDER BY quarter DESC), '[]'::jsonb)
      FROM (
        SELECT DISTINCT
          'Q' || ((EXTRACT(MONTH FROM filed_date)::int - 1) / 3 + 1)::text
          || ' ' || EXTRACT(YEAR FROM filed_date)::text AS quarter
        FROM public.cases
        WHERE form_type = 'I-526E' AND filed_date IS NOT NULL
      ) s
    ),
    'by_form', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          form_type,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE current_status ILIKE '%approved%') AS approved,
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE current_status ILIKE '%approved%') / NULLIF(COUNT(*), 0),
            1
          ) AS approved_pct,
          ROUND(
            percentile_cont(0.5) WITHIN GROUP (
              ORDER BY EXTRACT(EPOCH FROM (COALESCE(status_updated_at, now()) - filed_date::timestamptz)) / 86400.0 / 30.44
            )::numeric,
            1
          ) AS median_months
        FROM public.cases
        WHERE filed_date IS NOT NULL
          AND ('Q' || ((EXTRACT(MONTH FROM filed_date)::int - 1) / 3 + 1)::text
               || ' ' || EXTRACT(YEAR FROM filed_date)::text) = q
        GROUP BY form_type
        ORDER BY form_type
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Distinct project names for autocomplete (only names shared by onboarding users)
CREATE OR REPLACE FUNCTION public.list_project_name_suggestions(p_query text DEFAULT '')
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(name ORDER BY name), ARRAY[]::text[])
  FROM (
    SELECT trim(project_name) AS name
    FROM public.profiles
    WHERE onboarding_complete = true
      AND project_name IS NOT NULL
      AND length(trim(project_name)) > 0
      AND (p_query = '' OR project_name ILIKE '%' || p_query || '%')
    GROUP BY trim(project_name)
    HAVING COUNT(*) >= 1
    LIMIT 20
  ) s;
$$;

CREATE OR REPLACE FUNCTION public.list_rc_name_suggestions(p_query text DEFAULT '')
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(name ORDER BY name), ARRAY[]::text[])
  FROM (
    SELECT trim(regional_center_name) AS name
    FROM public.profiles
    WHERE onboarding_complete = true
      AND regional_center_name IS NOT NULL
      AND length(trim(regional_center_name)) > 0
      AND (p_query = '' OR regional_center_name ILIKE '%' || p_query || '%')
    GROUP BY trim(regional_center_name)
    HAVING COUNT(*) >= 1
    LIMIT 20
  ) s;
$$;

GRANT EXECUTE ON FUNCTION public.get_insights_overall() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_insights_by_project(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_insights_by_cohort(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_name_suggestions(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_rc_name_suggestions(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_insights_overall() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_insights_by_project(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_insights_by_cohort(text) TO service_role;
