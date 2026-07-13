-- EB5 Base — seed 10 real projects (Jul 2026)
-- Run the ENTIRE file in Supabase SQL Editor (select all, then Run).
-- Requires these rc_brands names (exact match):
--   EB5AN (EB-5 Affiliate Network)
--   CMB Regional Centers
--   Behring Regional Center
--   Golden Gate Global
--
-- Safe to re-run: each INSERT skips if brand + slug already exists.

-- EB5AN — Twin Lakes Georgia
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'Twin Lakes Georgia',
  'twin-lakes-georgia',
  b.id,
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
FROM public.rc_brands b
WHERE b.name = 'EB5AN (EB-5 Affiliate Network)'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'twin-lakes-georgia'
  );

-- EB5AN — Bay Creek Senior Loan
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'Bay Creek Senior Loan',
  'bay-creek-senior-loan',
  b.id,
  ARRAY['real_estate']::text[],
  'Cape Charles',
  'Virginia',
  ARRAY['rural']::text[],
  'approved',
  DATE '2025-10-07',
  800000,
  'open',
  'https://eb5visainvestments.com',
  'Master-planned community on Chesapeake Bay. Arnold Palmer + Jack Nicklaus golf courses. Senior loan with first-mortgage collateral, 4-year independent tranche terms. I-956F approved in 84 days, no RFEs.',
  'approved'
FROM public.rc_brands b
WHERE b.name = 'EB5AN (EB-5 Affiliate Network)'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'bay-creek-senior-loan'
  );

-- EB5AN — Currahee Club Senior Loan
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'Currahee Club Senior Loan',
  'currahee-club-senior-loan',
  b.id,
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
FROM public.rc_brands b
WHERE b.name = 'EB5AN (EB-5 Affiliate Network)'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'currahee-club-senior-loan'
  );

-- CMB — Kona Bay Hampton Inn
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'CMB Group 87 - Kona Bay Hampton Inn',
  'cmb-group-87-kona-bay-hampton-inn',
  b.id,
  ARRAY['hospitality']::text[],
  'Kailua-Kona',
  'Hawaii',
  ARRAY['rural']::text[],
  'approved',
  DATE '2024-07-01',
  800000,
  'open',
  'https://cmbeb5visa.com',
  'Redevelopment of historic hotel. Partnership with Shapery Enterprises. First I-526E approved Sep 2024, ~2.5 months after I-956F.',
  'approved'
FROM public.rc_brands b
WHERE b.name = 'CMB Regional Centers'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'cmb-group-87-kona-bay-hampton-inn'
  );

-- CMB — The Ellis
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'CMB Group 96 - The Ellis',
  'cmb-group-96-the-ellis',
  b.id,
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
FROM public.rc_brands b
WHERE b.name = 'CMB Regional Centers'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'cmb-group-96-the-ellis'
  );

-- CMB — Hillwood Park 275 BTS (logistics → other; app has no logistics type)
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'CMB Group 102 - Hillwood Park 275 BTS',
  'cmb-group-102-hillwood-park-275-bts',
  b.id,
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
FROM public.rc_brands b
WHERE b.name = 'CMB Regional Centers'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'cmb-group-102-hillwood-park-275-bts'
  );

-- Behring — CIVIC
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'CIVIC',
  'civic',
  b.id,
  ARRAY['infrastructure']::text[],
  'Oakland',
  'California',
  ARRAY['infra', 'hua']::text[],
  'approved',
  DATE '2025-07-01',
  800000,
  'open',
  'https://behringeb5.com',
  'VA medical center renovation at 1901/1950 Franklin St. Largest federal office lease in Oakland since 2021. 43,000+ visits/year expected. Infrastructure visa set-aside eligible. $23.2M EB-5 fund.',
  'approved'
FROM public.rc_brands b
WHERE b.name = 'Behring Regional Center'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'civic'
  );

-- Behring — RISE Fund
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'RISE Fund',
  'rise-fund',
  b.id,
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
FROM public.rc_brands b
WHERE b.name = 'Behring Regional Center'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'rise-fund'
  );

-- Golden Gate Global — Anasu Resort Phase 2
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'Anasu Resort Phase 2',
  'anasu-resort-phase-2',
  b.id,
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
FROM public.rc_brands b
WHERE b.name = 'Golden Gate Global'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'anasu-resort-phase-2'
  );

-- Golden Gate Global — Westcourt Downtown Orlando
INSERT INTO public.projects (
  name, slug, brand_id, project_type, location_city, location_state,
  tea_designations, f956_status, f956_approval_date, investment_amount,
  subscription_status, website_url, notes, status
)
SELECT
  'Westcourt Downtown Orlando',
  'westcourt-downtown-orlando',
  b.id,
  ARRAY['real_estate', 'hospitality']::text[],
  'Orlando',
  'Florida',
  ARRAY['hua']::text[],
  'approved',
  DATE '2026-05-28',
  800000,
  'open',
  'https://goldengateglobal.us',
  'Mixed-use: 265-key Kimpton hotel + 269 multifamily units + 1,145-stall parking garage. Adjacent to Kia Center (Orlando Magic). I-956F approved in 4 months. ~50% pre-booked.',
  'approved'
FROM public.rc_brands b
WHERE b.name = 'Golden Gate Global'
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.brand_id = b.id AND p.slug = 'westcourt-downtown-orlando'
  );

-- Verify (should return 10 rows)
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
