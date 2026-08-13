#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import { parseManifest, parseManifestEntry } from './i526-parse.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

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

// Node < 22 lacks native WebSocket — install polyfill on globalThis using ws package
try {
  const mod = await import('ws');
  const wsCtor = mod.WebSocket ?? mod.default?.WebSocket ?? mod.default;
  if (typeof wsCtor === 'function' && !globalThis.WebSocket) {
    globalThis.WebSocket = wsCtor;
  }
} catch {
  // ignore
}
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const manifest = parseManifest();
console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Manifest entries: ${manifest.files.length}`);

async function upsertRelease(entry) {
  const payload = {
    dataset: entry.dataset,
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
    .eq('dataset', entry.dataset)
    .eq('as_of_quarter', entry.as_of_quarter)
    .maybeSingle();
  if (error) throw error;
  if (rows) {
    if (DRY_RUN) console.log(`  (dry) UPDATE release id=${rows.id} for ${entry.dataset}/${entry.as_of_quarter}`);
    else {
      const { error: upd } = await supabase
        .from('i526_releases')
        .update(payload)
        .eq('id', rows.id);
      if (upd) throw upd;
    }
    return rows.id;
  }
  if (DRY_RUN) {
    console.log(`  (dry) INSERT release for ${entry.dataset}/${entry.as_of_quarter}`);
    return -1;
  }
  const { data, error: ins } = await supabase.from('i526_releases').insert(payload).select('id').single();
  if (ins) throw ins;
  return data.id;
}

async function truncateCellsForRelease(releaseId, dataset) {
  const childTable = dataset === 'FILINGS_COUNTRY_TEA' ? 'i526_filing_cells' : 'i526_processing_summary';
  if (DRY_RUN) {
    console.log(`  (dry) DELETE FROM ${childTable} release_id=${releaseId}`);
    return;
  }
  const { error } = await supabase.from(childTable).delete().eq('release_id', releaseId);
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
  // batch
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('i526_filing_cells').insert(batch);
    if (error) throw new Error(`filing_cells insert batch failed: ${error.message}`);
  }
}

async function insertProcessingRows(releaseId, rows) {
  if (rows.length === 0) return;
  const payloads = rows.map((r) => ({
    release_id: releaseId,
    form_type: r.form_type,
    q_receipts: r.q_receipts ?? null,
    q_approvals: r.q_approvals ?? null,
    q_denials: r.q_denials ?? null,
    q_completions: r.q_completions ?? null,
    ytd_receipts: r.ytd_receipts ?? null,
    ytd_approvals: r.ytd_approvals ?? null,
    pending: r.pending ?? null,
    suppressed_q: !!r.suppressed_q,
    median_processing_months: r.median_processing_months ?? null,
  }));
  if (DRY_RUN) {
    console.log(`  (dry) INSERT i526_processing_summary rows=${payloads.length}`);
    return;
  }
  const { error } = await supabase.from('i526_processing_summary').insert(payloads);
  if (error) throw error;
}

async function main() {
  for (const entry of manifest.files) {
    console.log(`\n--- ${entry.as_of_quarter} ${entry.dataset} ---`);
    if (!entry.file) {
      console.log('  No workbook listed in manifest (file: null); skipping parse. Release metadata will still be stored when non-null.');
    }
    const parsed = entry.file ? parseManifestEntry(entry) : null;
    const releaseId = await upsertRelease(entry);
    await truncateCellsForRelease(releaseId, entry.dataset);
    if (parsed && entry.dataset === 'FILINGS_COUNTRY_TEA') {
      await insertFilingCells(releaseId, parsed.cells);
      console.log(`  filing_cells: inserted ${parsed.cells.length} rows, release=${releaseId}`);
    } else if (parsed) {
      await insertProcessingRows(releaseId, parsed.rows);
      console.log(`  processing_summary: inserted ${parsed.rows.length} rows, release=${releaseId}`);
    }
  }
  if (DRY_RUN) {
    console.log('\n[DRY RUN] No DB changes made. Re-run without --dry-run to persist.');
  } else {
    // final count report
    const [r1, r2, r3] = await Promise.all([
      supabase.from('i526_releases').select('id', { count: 'exact', head: true }),
      supabase.from('i526_filing_cells').select('id', { count: 'exact', head: true }),
      supabase.from('i526_processing_summary').select('id', { count: 'exact', head: true }),
    ]);
    console.log(`\nDone. DB counts: releases=${r1.count}, filing_cells=${r2.count}, processing_summary=${r3.count}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
