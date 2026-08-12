# Analysis: I-485 Pending Inventory

The `/analysis/i485` page visualizes the monthly USCIS report "Pending
Applications for Employment-Based Preference Categories" (pending
employment-based I-485s by preference category, country of chargeability, and
priority date).

## Data flow

1. **Raw workbooks** live in `data/uscis-i485/` (26 XLSX files, Feb 2024 to
   May 2026) with `manifest.json` recording each file's as-of date, USCIS
   publish date, official download URL, and source note. Raw-data links shown
   on the site always point to uscis.gov, never to our copies.
2. **Schema**: `supabase/migrations/20260812_i485_inventory.sql` creates
   `i485_releases` (one row per snapshot) and `i485_inventory_cells` (one row
   per non-zero cell; ~2,300 rows per snapshot, ~61k total). Public read via
   RLS; writes are service-role only.
3. **Ingest**: `npm run analysis:ingest-i485` parses every workbook in the
   manifest and upserts into Supabase. Idempotent: re-running replaces each
   release's cells wholesale. `-- --dry-run` parses and validates without
   touching the database.

## Deploying / updating

1. Apply the migration in the Supabase SQL Editor (once).
2. Run the ingest with production env available (`.env.local` with
   `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):

   ```bash
   npm run analysis:ingest-i485 -- --dry-run   # validate parse
   npm run analysis:ingest-i485                # load into Supabase
   ```

3. When USCIS posts a new snapshot: download the XLSX into
   `data/uscis-i485/`, add an entry to `manifest.json` (file, as_of_date,
   published_date, source_url, source_title, source_note), re-run the
   ingest, then regenerate the public CSV:

   ```bash
   npm run analysis:ingest-i485
   npm run analysis:export-i485-csv   # → public/data/i485-pending-inventory.csv
   ```

## Explorer

`/analysis/i485` supports snapshot, compare, and cohort views. Each chart shows
an X-axis caption: **Priority date** on snapshot/compare, **USCIS snapshot** on
cohort. Snapshot keeps a priority-date grain toggle (months / calendar quarters /
fiscal years) and a **Split** control: None (bars), By country, or By category
(multi-series lines). Split lines are still pending stock by priority date in one
snapshot — not a time series across releases.

Cohort tracks selected **priority-date years** across USCIS releases (multi-select
chips from 2023 onward, plus an optional Previous years range). The X axis is
always monthly USCIS snapshots (one point per release). Two independent controls:

- **Priority date**: None · Months · Quarters (default) · Halves · Fiscal years —
  multi-series lines when not None; each series starts at the first feasible
  snapshot
- **Split**: None · By country · By category — country/category open **one chart
  per facet** (small multiples). Combines with priority-date series when both
  are set

Compare diffs two snapshot releases by priority-date bucket (later − earlier).
It uses the same priority-date year chips as cohort (defaults **2023–2024** so
recent growth does not dominate older cohorts), a **Priority date** grain toggle
(months / quarters / fiscal years), and **Split** into faceted diff charts by
country or category. Hover on a bar shows earlier → later counts and the signed
change; **Show data** reveals the underlying table.

## Data caveats (reflected in page copy)

- Counts are pending applications at USCIS only: no DOS consular queue, no
  approved-I-140-not-yet-filed demand.
- The report shows pending stock, not adjudications; month-over-month change
  mixes new filings with completions.
- Values under 10 are suppressed ("D"). The ingest stores them as
  `count = NULL, suppressed = true`; the UI excludes them from totals and
  shows how many cells are hidden.
- Zero cells ("-") are omitted from the table; absence means zero.
- EB-5 set-asides are one lump bucket (`EB5_SET_ASIDE`) from the May-July 2024
  snapshots; Rural / High Unemployment / Infrastructure are separate from
  August 2024 onward. Feb 2024 has EB-5 priority dates only through 2022.
- June and July 2025 snapshots were never published by USCIS.
- Publish lag is roughly 1.5 to 5 months after the as-of date.
