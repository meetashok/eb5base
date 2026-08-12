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
import { parseWorkbook } from './i485-parse.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DATA_DIR = path.join(ROOT, 'data', 'uscis-i485');
const DRY_RUN = process.argv.includes('--dry-run');

function loadDotEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
loadDotEnvLocal();

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
