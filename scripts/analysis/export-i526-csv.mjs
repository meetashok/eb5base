#!/usr/bin/env node
/**
 * Build consolidated CSVs of every USCIS I-526 filing + processing cell
 * from data/uscis-i526/ workbooks, for user download / analysis.
 *
 * Usage:
 *   node scripts/analysis/export-i526-csv.mjs
 *
 * Writes:
 *   public/data/i526-quarterly.csv       (Dataset A — per-country/TEA/month filings)
 *   public/data/i526-processing-summary.csv (Dataset B — per-form throughput)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { parseManifestEntry, parseManifest } from './i526-parse.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const OUT_A = path.join(OUT_DIR, 'i526-quarterly.csv');
const OUT_B = path.join(OUT_DIR, 'i526-processing-summary.csv');

const HEADERS_A = [
  'as_of_quarter',
  'dataset',
  'period_start',
  'period_end',
  'published_date',
  'form_type',
  'country',
  'tea_category',
  'receipt_year',
  'receipt_quarter',
  'receipt_month',
  'count',
  'suppressed',
  'source_url',
  'source_title',
];

const HEADERS_B = [
  'as_of_quarter',
  'dataset',
  'period_start',
  'period_end',
  'published_date',
  'form_type',
  'q_receipts',
  'q_approvals',
  'q_denials',
  'q_completions',
  'ytd_receipts',
  'ytd_approvals',
  'pending',
  'median_processing_months',
  'suppressed_q',
  'source_url',
  'source_title',
];

function csvEscape(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  const manifest = parseManifest();
  const entries = [...manifest.files].sort((a, b) => {
    if (a.as_of_quarter !== b.as_of_quarter) return a.as_of_quarter < b.as_of_quarter ? -1 : 1;
    return a.dataset.localeCompare(b.dataset);
  });

  const linesA = [HEADERS_A.join(',')];
  const linesB = [HEADERS_B.join(',')];
  let rowsA = 0, rowsB = 0;

  for (const entry of entries) {
    const res = entry.file ? parseManifestEntry(entry) : null;
    if (entry.dataset === 'FILINGS_COUNTRY_TEA' && res) {
      for (const c of res.cells) {
        linesA.push([
          entry.as_of_quarter, entry.dataset, entry.period_start, entry.period_end,
          entry.published_date ?? '', c.form_type, c.country, c.tea_category,
          c.receipt_year ?? '', c.receipt_quarter ?? '', c.receipt_month ?? '',
          c.suppressed ? '' : (c.count ?? ''), c.suppressed ? 'true' : 'false',
          entry.source_url, entry.source_title,
        ].map(csvEscape).join(','));
        rowsA++;
      }
      console.log(`${entry.as_of_quarter} A: +${res.cells.length} rows`);
    } else if (entry.dataset === 'ALL_FORMS_SUMMARY' && res) {
      for (const r of res.rows) {
        linesB.push([
          entry.as_of_quarter, entry.dataset, entry.period_start, entry.period_end,
          entry.published_date ?? '', r.form_type,
          r.q_receipts ?? '', r.q_approvals ?? '', r.q_denials ?? '', r.q_completions ?? '',
          r.ytd_receipts ?? '', r.ytd_approvals ?? '', r.pending ?? '',
          r.median_processing_months ?? '', r.suppressed_q ? 'true' : 'false',
          entry.source_url, entry.source_title,
        ].map(csvEscape).join(','));
        rowsB++;
      }
      console.log(`${entry.as_of_quarter} B: +${res.rows.length} rows`);
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_A, `${linesA.join('\n')}\n`, 'utf8');
  writeFileSync(OUT_B, `${linesB.join('\n')}\n`, 'utf8');
  console.log(`\nWrote A ${rowsA} rows → ${path.relative(ROOT, OUT_A)}`);
  console.log(`Wrote B ${rowsB} rows → ${path.relative(ROOT, OUT_B)}`);
}

main();
