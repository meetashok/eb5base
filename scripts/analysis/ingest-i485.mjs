#!/usr/bin/env node
/**
 * Ingest USCIS EB I-485 pending inventory workbooks into Supabase.
 *
 * Reads data/uscis-i485/manifest.json + the XLSX files next to it,
 * normalizes every sheet into (country, category, visa_status, pd_month,
 * pd_year) cells, and upserts into i485_releases / i485_inventory_cells.
 *
 * Usage:
 *   node scripts/analysis/ingest-i485.mjs            # ingest into Supabase
 *   node scripts/analysis/ingest-i485.mjs --dry-run  # parse + validate only
 *
 * Env (ingest mode): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (reads .env.local automatically if present).
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const XLSX = createRequire(import.meta.url)('xlsx');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DATA_DIR = path.join(ROOT, 'data', 'uscis-i485');
const DRY_RUN = process.argv.includes('--dry-run');

// -- env -------------------------------------------------------------------
function loadDotEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
loadDotEnvLocal();

// -- normalization maps ------------------------------------------------------
const COUNTRY_BY_SHEET = {
  'Rest of the World': 'rest_of_world',
  China: 'china',
  'India (EB1 EW3 EB4 CRW EB5)': 'india',
  'India (EB2 EB3)': 'india',
  Mexico: 'mexico',
  Philippines: 'philippines',
};

const CATEGORY_MAP = {
  'Employment-Based 1st Preference Category (EB1)': 'EB1',
  'Employment-Based 2nd Preference Category (EB2)': 'EB2',
  'Employment-Based 3rd Preference Category (EB3)': 'EB3',
  'Employment-Based 3rd Preference Category Other Worker (EW3)': 'EW3',
  'Employment-Based 4th Preference Category (EB4)': 'EB4',
  'Employment-Based 4th Preference Category Certain Religious Workers (CRW)': 'CRW',
  'Employment-Based 5th Preference Category Unreserved (EB5)': 'EB5_UNRESERVED',
  'Employment-Based 5th Preference Category Set Aside (EB5)': 'EB5_SET_ASIDE',
  'Employment-Based 5th Preference Category Set Aside: Rural (20%) (EB5)': 'EB5_RURAL',
  'Employment-Based 5th Preference Category Set Aside: High Unemployment (10%) (EB5)':
    'EB5_HIGH_UNEMPLOYMENT',
  'Employment-Based 5th Preference Category Set Aside: Infrastructure (2%) (EB5)':
    'EB5_INFRASTRUCTURE',
};

const STATUS_MAP = {
  Available: 'available',
  'Awaiting Availability': 'awaiting',
};

const MONTHS = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

// Some workbooks use underscores in sheet names (e.g. Rest_of_the_World).
const normSheetName = (s) => s.replace(/_/g, ' ').replace('How to-Read', 'How to Read');

// -- parse one workbook ------------------------------------------------------
function parseWorkbook(filePath) {
  const wb = XLSX.readFile(filePath, { dense: true });
  const cells = [];
  let cellCount = 0;
  for (const rawName of wb.SheetNames) {
    const country = COUNTRY_BY_SHEET[normSheetName(rawName)];
    if (!country) continue; // "How to Read This Report"
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[rawName], { header: 1, raw: false });

    const headerIdx = rows.findIndex(
      (r) => r && String(r[0] ?? '').trim() === 'Country Of Chargeability',
    );
    if (headerIdx < 0) throw new Error(`${path.basename(filePath)} / ${rawName}: header row not found`);

    const header = rows[headerIdx].map((c) => String(c ?? '').trim());
    if (
      header[1] !== 'Preference Category' ||
      header[2] !== 'Visa Status' ||
      header[3] !== 'Priority Date Month'
    ) {
      throw new Error(`${path.basename(filePath)} / ${rawName}: unexpected header ${header.slice(0, 4)}`);
    }
    // Year columns: "Priority Date Year - Prior Years" | "Priority Date Year - 2017" ...
    const yearCols = [];
    for (let c = 4; c < header.length; c += 1) {
      const label = header[c].replace('Priority Date Year - ', '').trim();
      if (!label) continue;
      yearCols.push({ col: c, year: /^\d{4}$/.test(label) ? Number(label) : 0 });
    }
    if (yearCols.length === 0) throw new Error(`${rawName}: no year columns`);

    for (let r = headerIdx + 1; r < rows.length; r += 1) {
      const row = rows[r];
      if (!row) continue;
      const rawCountry = String(row[0] ?? '').trim();
      if (!rawCountry) continue;
      // Bottom-of-sheet notes reuse column A; stop at first non-data row.
      if (!Object.values(COUNTRY_BY_SHEET).includes(COUNTRY_BY_SHEET[rawCountry] ?? '')) {
        if (!(rawCountry in { 'Rest of the World': 1, China: 1, India: 1, Mexico: 1, Philippines: 1 })) {
          continue;
        }
      }
      const category = CATEGORY_MAP[String(row[1] ?? '').trim()];
      const visaStatus = STATUS_MAP[String(row[2] ?? '').trim()];
      const pdMonth = MONTHS[String(row[3] ?? '').trim()];
      if (!category || !visaStatus || !pdMonth) continue;

      for (const { col, year } of yearCols) {
        const raw = String(row[col] ?? '').trim();
        if (!raw || raw === '-') continue; // zero / rounds to zero
        cellCount += 1;
        if (raw === 'D') {
          cells.push({ country, category, visa_status: visaStatus, pd_year: year, pd_month: pdMonth, count: null, suppressed: true });
        } else {
          const n = Number(raw.replace(/,/g, ''));
          if (!Number.isFinite(n)) throw new Error(`${rawName} row ${r}: bad value ${raw}`);
          if (n === 0) continue; // explicit zero, omit like "-"
          cells.push({ country, category, visa_status: visaStatus, pd_year: year, pd_month: pdMonth, count: n, suppressed: false });
        }
      }
    }
  }
  return { cells, cellCount };
}

// -- main --------------------------------------------------------------------
async function main() {
  const manifest = JSON.parse(readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf8'));
  const parsed = [];
  for (const entry of manifest.files) {
    const filePath = path.join(DATA_DIR, entry.file);
    const { cells } = parseWorkbook(filePath);
    const total = cells.reduce((s, c) => s + (c.count ?? 0), 0);
    const suppressed = cells.filter((c) => c.suppressed).length;
    parsed.push({ entry, cells });
    console.log(
      `${entry.as_of_date}  cells=${String(cells.length).padStart(6)}  ` +
        `disclosed_total=${String(total).padStart(8)}  suppressed=${suppressed}`,
    );
  }

  if (DRY_RUN) {
    console.log(`\nDry run OK: ${parsed.length} releases parsed.`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const { entry, cells } of parsed) {
    const { data: release, error: relErr } = await supabase
      .from('i485_releases')
      .upsert(
        {
          as_of_date: entry.as_of_date,
          published_date: entry.published_date,
          source_url: entry.source_url,
          source_title: entry.source_title,
          source_note: entry.source_note,
        },
        { onConflict: 'as_of_date' },
      )
      .select('id')
      .single();
    if (relErr) throw new Error(`release ${entry.as_of_date}: ${relErr.message}`);

    // Replace cells for this release wholesale (idempotent re-ingest).
    const { error: delErr } = await supabase
      .from('i485_inventory_cells')
      .delete()
      .eq('release_id', release.id);
    if (delErr) throw new Error(`clear ${entry.as_of_date}: ${delErr.message}`);

    for (let i = 0; i < cells.length; i += 1000) {
      const batch = cells.slice(i, i + 1000).map((c) => ({ ...c, release_id: release.id }));
      const { error } = await supabase.from('i485_inventory_cells').insert(batch);
      if (error) throw new Error(`insert ${entry.as_of_date} @${i}: ${error.message}`);
    }
    console.log(`ingested ${entry.as_of_date} (${cells.length} cells)`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
