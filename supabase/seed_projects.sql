-- EB5 Base — seed 10 real projects (Jul 2026)
-- Run in Supabase SQL Editor after rc_brands exist with these exact names:
--   EB5AN (EB-5 Affiliate Network)
--   CMB Regional Centers
--   Behring Regional Center
--   Golden Gate Global
--
-- Safe to re-run: skips projects that already exist (same brand + slug).

DO $$
DECLARE
  eb5an_id uuid;
  cmb_id uuid;
  behring_id uuid;
  ggg_id uuid;
BEGIN
  SELECT id INTO eb5an_id FROM public.rc_brands WHERE name = 'EB5AN (EB-5 Affiliate Network)' LIMIT 1;
  SELECT id INTO cmb_id FROM public.rc_brands WHERE name = 'CMB Regional Centers' LIMIT 1;
  SELECT id INTO behring_id FROM public.rc_brands WHERE name = 'Behring Regional Center' LIMIT 1;
  SELECT id INTO ggg_id FROM public.rc_brands WHERE name = 'Golden Gate Global' LIMIT 1;

  IF eb5an_id IS NULL OR cmb_id IS NULL OR behring_id IS NULL OR ggg_id IS NULL THEN
    RAISE EXCEPTION 'Missing rc_brands. Found: EB5AN=%, CMB=%, Behring=%, GGG=%',
      eb5an_id, cmb_id, behring_id, ggg_id;
  END IF;

  -- EB5AN
  INSERT INTO public.projects (
    name, slug, brand_id, project_type, location_city, location_state,
    tea_designations, f956_status, f956_approval_date, investment_amount,
    subscription_status, website_url, notes, status
  )
  SELECT v.*
  FROM (VALUES
    (
      'Twin Lakes Georgia',
      'twin-lakes-georgia',
      eb5an_id,
      ARRAY['real_estate']::text[],
      'Twin Lakes',
      'Georgia',
      ARRAY['rural']::text[],
      'approved',
      NULL::date,
      800000,
      'closed',
      'https://eb5visainvestments.com',
      '340+ I-526E approvals, 850 homes sold, 750 delivered. One of the most successful rural projects in EB-5 history.',
      'approved'
    ),
    (
      'Bay Creek Senior Loan',
      'bay-creek-senior-loan',
      eb5an_id,
      ARRAY['real_estate']::text[],
      'Cape Charles',
      'Virginia',
      ARRAY['rural']::text[],
      'approved',
      '2025-10-07'::date,
      800000,
      'open',
      'https://eb5visainvestments.com',
      'Master-planned community on Chesapeake Bay. Arnold Palmer + Jack Nicklaus golf courses. Senior loan with first-mortgage collateral, 4-year independent tranche terms. I-956F approved in 84 days, no RFEs.',
      'approved'
    ),
    (
      'Currahee Club Senior Loan',
      'currahee-club-senior-loan',
      eb5an_id,
      ARRAY['real_estate']::text[],
      'Toccoa',
      'Georgia',
      ARRAY['rural']::text[],
      'unknown',
      NULL::date,
      800000,
      'open',
      'https://eb5visainvestments.com',
      '1,087-acre master-planned golf/residential community near Atlanta. Senior loan structure. Located near Twin Lakes Georgia.',
      'approved'
    )
  ) AS v(
    name, slug, brand_id, project_type, location_city, location_state,
    tea_designations, f956_status, f956_approval_date, investment_amount,
    subscription_status, website_url, notes, status
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.brand_id = v.brand_id AND p.slug = v.slug
  );

  -- CMB
  INSERT INTO public.projects (
    name, slug, brand_id, project_type, location_city, location_state,
    tea_designations, f956_status, f956_approval_date, investment_amount,
    subscription_status, website_url, notes, status
  )
  SELECT v.*
  FROM (VALUES
    (
      'CMB Group 87 - Kona Bay Hampton Inn',
      'cmb-group-87-kona-bay-hampton-inn',
      cmb_id,
      ARRAY['hospitality']::text[],
      'Kailua-Kona',
      'Hawaii',
      ARRAY['rural']::text[],
      'approved',
      '2024-07-01'::date,
      800000,
      'open',
      'https://cmbeb5visa.com',
      'Redevelopment of historic hotel. Partnership with Shapery Enterprises. First I-526E approved Sep 2024, ~2.5 months after I-956F.',
      'approved'
    ),
    (
      'CMB Group 96 - The Ellis',
      'cmb-group-96-the-ellis',
      cmb_id,
      ARRAY['real_estate']::text[],
      'Eugene',
      'Oregon',
      ARRAY['hua']::text[],
      'unknown',
      NULL::date,
      800000,
      'open',
      'https://cmbeb5visa.com',
      '14-story, 306-unit student housing adjacent to University of Oregon. 17,000 sqft retail. Partnership with Fields Holdings. $40M EB-5 loan, ~$128.2M total project.',
      'approved'
    ),
    (
      'CMB Group 102 - Hillwood Park 275 BTS',
      'cmb-group-102-hillwood-park-275-bts',
      cmb_id,
      ARRAY['other']::text[],
      'Cincinnati',
      'Ohio',
      ARRAY['hua']::text[],
      'unknown',
      NULL::date,
      800000,
      'open',
      'https://cmbeb5visa.com',
      '46th CMB-Hillwood collaboration. Class-A distribution facility for leading hardware retailer. $36.8M EB-5 loan, ~$76.4M total project.',
      'approved'
    )
  ) AS v(
    name, slug, brand_id, project_type, location_city, location_state,
    tea_designations, f956_status, f956_approval_date, investment_amount,
    subscription_status, website_url, notes, status
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.brand_id = v.brand_id AND p.slug = v.slug
  );

  -- Behring
  INSERT INTO public.projects (
    name, slug, brand_id, project_type, location_city, location_state,
    tea_designations, f956_status, f956_approval_date, investment_amount,
    subscription_status, website_url, notes, status
  )
  SELECT v.*
  FROM (VALUES
    (
      'CIVIC',
      'civic',
      behring_id,
      ARRAY['infrastructure']::text[],
      'Oakland',
      'California',
      ARRAY['infra', 'hua']::text[],
      'approved',
      '2025-07-01'::date,
      800000,
      'open',
      'https://behringeb5.com',
      'VA medical center renovation at 1901/1950 Franklin St. Largest federal office lease in Oakland since 2021. 43,000+ visits/year expected. Infrastructure visa set-aside eligible. $23.2M EB-5 fund.',
      'approved'
    ),
    (
      'RISE Fund',
      'rise-fund',
      behring_id,
      ARRAY['real_estate']::text[],
      'San Francisco Bay Area',
      'California',
      ARRAY['hua']::text[],
      'approved',
      NULL::date,
      800000,
      'open',
      'https://behringeb5.com',
      'Diversified 10-asset multifamily apartment portfolio by Riaz Capital. $104.8M EB-5 fund. Debt + preferred equity + common equity structure. 3yr (debt) / 5yr (equity) terms.',
      'approved'
    )
  ) AS v(
    name, slug, brand_id, project_type, location_city, location_state,
    tea_designations, f956_status, f956_approval_date, investment_amount,
    subscription_status, website_url, notes, status
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.brand_id = v.brand_id AND p.slug = v.slug
  );

  -- Golden Gate Global
  INSERT INTO public.projects (
    name, slug, brand_id, project_type, location_city, location_state,
    tea_designations, f956_status, f956_approval_date, investment_amount,
    subscription_status, website_url, notes, status
  )
  SELECT v.*
  FROM (VALUES
    (
      'Anasu Resort Phase 2',
      'anasu-resort-phase-2',
      ggg_id,
      ARRAY['hospitality']::text[],
      'Healdsburg',
      'California',
      ARRAY['rural']::text[],
      'approved',
      NULL::date,
      800000,
      'open',
      'https://goldengateglobal.us',
      'Luxury wine country resort by Adrian Zecha (founder of Aman Resorts). Phase 1A fully subscribed with 100+ I-526E approvals. Construction actively underway.',
      'approved'
    ),
    (
      'Westcourt Downtown Orlando',
      'westcourt-downtown-orlando',
      ggg_id,
      ARRAY['real_estate', 'hospitality']::text[],
      'Orlando',
      'Florida',
      ARRAY['hua']::text[],
      'approved',
      '2026-05-28'::date,
      800000,
      'open',
      'https://goldengateglobal.us',
      'Mixed-use: 265-key Kimpton hotel + 269 multifamily units + 1,145-stall parking garage. Adjacent to Kia Center (Orlando Magic). I-956F approved in 4 months. ~50% pre-booked.',
      'approved'
    )
  ) AS v(
    name, slug, brand_id, project_type, location_city, location_state,
    tea_designations, f956_status, f956_approval_date, investment_amount,
    subscription_status, website_url, notes, status
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.brand_id = v.brand_id AND p.slug = v.slug
  );
END $$;

-- Verify
SELECT b.name AS rc_brand, p.name, p.slug, p.f956_status, p.subscription_status, p.status
FROM public.projects p
JOIN public.rc_brands b ON b.id = p.brand_id
WHERE b.name IN (
  'EB5AN (EB-5 Affiliate Network)',
  'CMB Regional Centers',
  'Behring Regional Center',
  'Golden Gate Global'
)
ORDER BY b.name, p.name;
