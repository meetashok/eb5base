#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'data', 'uscis-i526');
const OUT_DIR = path.join(DATA_DIR, 'generated_suzanne');

function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) return;
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvLocal();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
try {
  const mod = await import('ws');
  const wsCtor = mod.WebSocket ?? mod.default?.WebSocket ?? mod.default;
  if (typeof wsCtor === 'function' && !globalThis.WebSocket) {
    globalThis.WebSocket = wsCtor;
  }
} catch {}
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

async function upsertRelease(entry) {
  const payload = {
    dataset: 'FILINGS_COUNTRY_TEA',
    as_of_quarter: entry.as_of_quarter,
    period_start: entry.period_start,
    period_end: entry.period_end,
    published_date: entry.published_date ?? null,
    source_url: entry.source_url,
    source_title: entry.source_title,
    source_note: entry.source_note ?? null,
  };
  const { data: rows, error } = await supabase
    .from('i526_releases')
    .select('id, dataset, as_of_quarter')
    .eq('dataset', 'FILINGS_COUNTRY_TEA')
    .eq('as_of_quarter', entry.as_of_quarter)
    .maybeSingle();
  if (error) throw error;
  if (rows) {
    if (DRY_RUN) {
      console.log(`  (dry) UPDATE release id=${rows.id} for ${entry.as_of_quarter}`);
    } else {
      const { error: upd } = await supabase
        .from('i526_releases').update(payload).eq('id', rows.id);
      if (upd) throw upd;
    }
    return rows.id;
  }
  if (DRY_RUN) {
    console.log(`  (dry) INSERT release ${entry.as_of_quarter}`);
    return -1;
  }
  const { data, error: ins } = await supabase.from('i526_releases').insert(payload).select('id').single();
  if (ins) throw ins;
  return data.id;
}

async function truncateCellsForRelease(releaseId) {
  if (DRY_RUN) {
    console.log(`  (dry) DELETE FROM i526_filing_cells WHERE release_id=${releaseId}`);
    return;
  }
  const { error } = await supabase.from('i526_filing_cells').delete().eq('release_id', releaseId);
  if (error) throw error;
}

async function insertFilingCells(releaseId, cells) {
  if (cells.length === 0) return;
  const rows = cells.map((c) => ({
    release_id: releaseId,
    country: c.country,
    form_type: c.form_type,
    tea_category: c.tea_category,
    receipt_year: c.receipt_year ?? null,
    receipt_quarter: c.receipt_quarter ?? null,
    receipt_month: c.receipt_month ?? null,
    count: c.count ?? null,
    suppressed: !!c.suppressed,
  }));
  if (DRY_RUN) {
    console.log(`  (dry) INSERT i526_filing_cells rows=${rows.length}`);
    return;
  }
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('i526_filing_cells').insert(batch);
    if (error) throw new Error(`filing_cells insert batch failed: ${error.message}`);
  }
}

const DROPBOX_URL = 'https://www.dropbox.com/scl/fi/xkbkaox1hgepg6nn6v3l9/EB5-Backlog-Analysis.xlsx';

const RELEASES = ['FY2025Q1', 'FY2025Q2'].map((rk) => {
  const [, fyStr, qStr] = /^FY(\d{4})Q(\d)$/.exec(rk) ?? [];
  const fy = Number(fyStr); const q = Number(qStr);
  const qMonths = q === 1 ? [10, 11, 12] : q === 2 ? [1, 2, 3] : q === 3 ? [4, 5, 6] : [7, 8, 9];
  const calStart = q === 1 ? fy - 1 : fy;
  const calEnd = q === 4 ? fy : (q === 1 ? fy - 1 : fy);
  const endDay =
    q === 1 ? (qMonths[2] === 12 ? 31 : qMonths[2] === 11 ? 30 : 31)
    : q === 2 ? (qMonths[2] === 2 ? 28 : 30)
    : q === 3 ? (qMonths[2] === 6 ? 30 : 30)
    : 30;
  const published =
    q === 1 ? `${fy-1}-12-15`
    : q === 2 ? `${fy}-03-15`
    : q === 3 ? `${fy}-06-15`
    : `${fy}-09-15`;
  return {
    releaseKey: rk,
    as_of_quarter: rk,
    period_start: `${calStart}-${String(qMonths[0]).padStart(2,'0')}-01`,
    period_end: `${calEnd}-${String(qMonths[2]).padStart(2,'0')}-${endDay}`,
    published_date: published,
  };
});

async function main() {
  for (const release of RELEASES) {
    console.log(`\n=== ${release.releaseKey} FILINGS_COUNTRY_TEA (Suzanne backlog) ===`);
    const metaFile = path.join(OUT_DIR, `suzanne_${release.releaseKey}_meta.json`);
    const cellsFile = path.join(OUT_DIR, `suzanne_${release.releaseKey}_cells.json`);
    if (!fs.existsSync(metaFile) || !fs.existsSync(cellsFile)) {
      console.error(`  ⛔ Missing parsed JSONs from suzanne_probe_and_parse.mjs must run FIRST before this script. Expected: ${metaFile} ${cellsFile}`);
      process.exit(4);
    }
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    const { cells } = JSON.parse(fs.readFileSync(cellsFile, 'utf8'));
    const manifestEntry = {
      dataset: 'FILINGS_COUNTRY_TEA',
      as_of_quarter: release.as_of_quarter,
      period_start: meta.period_start ?? release.period_start,
      period_end: meta.period_end ?? release.period_end,
      published_date: meta.published_date ?? release.published_date,
      source_url: DROPBOX_URL,
      source_title: `EB5 Backlog Analysis -- I-526/I-526E filings by country/TEA/month for ${release.releaseKey} (Suzanne Lazicki shared workbook)`,
      source_note: `Dataset A, extracted from Suzanne Lazicki shared Dropbox EB5-Backlog-Analysis.xlsx shared workbook for the ${release.releaseKey} quarter. Column layout concatenates Form | Month-Year + Investment type (TEA) in column B. Covers months Oct 2024 through Mar 2025.`,
    };
    const releaseId = await upsertRelease(manifestEntry);
    await truncateCellsForRelease(releaseId);
    await insertFilingCells(releaseId, cells);
    const total = cells.reduce((a, b) => a + (b.count ?? 0), 0);
    const totalSupp = cells.filter(c => c.suppressed).length;
    console.log(`  inserted cells=${cells.length}, total filings=${total}, suppressedCells=${totalSupp}. releaseId=${releaseId}`);
  }
  console.log('\n✅ Done Suzanne gap fill (FY25 Q1 + Q2 Dataset A). Reload trend page, gap should now be filled.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
