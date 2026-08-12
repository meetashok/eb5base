#!/usr/bin/env node
/**
 * Build a consolidated CSV of every USCIS I-485 pending-inventory cell
 * from data/uscis-i485/ workbooks, for user download / analysis.
 *
 * Usage:
 *   node scripts/analysis/export-i485-csv.mjs
 *
 * Writes: public/data/i485-pending-inventory.csv
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { parseWorkbook } from './i485-parse.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DATA_DIR = path.join(ROOT, 'data', 'uscis-i485');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'i485-pending-inventory.csv');

const HEADERS = [
  'as_of_date',
  'published_date',
  'country',
  'category',
  'visa_status',
  'pd_year',
  'pd_month',
  'count',
  'suppressed',
  'source_url',
];

function csvEscape(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  const manifest = JSON.parse(readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf8'));
  const files = [...manifest.files].sort((a, b) =>
    a.as_of_date < b.as_of_date ? -1 : 1,
  );

  const lines = [HEADERS.join(',')];
  let rows = 0;

  for (const entry of files) {
    const filePath = path.join(DATA_DIR, entry.file);
    const { cells } = parseWorkbook(filePath);
    for (const c of cells) {
      lines.push(
        [
          entry.as_of_date,
          entry.published_date ?? '',
          c.country,
          c.category,
          c.visa_status,
          c.pd_year,
          c.pd_month,
          c.suppressed ? '' : c.count,
          c.suppressed ? 'true' : 'false',
          entry.source_url,
        ]
          .map(csvEscape)
          .join(','),
      );
      rows += 1;
    }
    console.log(`${entry.as_of_date}  +${cells.length} rows`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${lines.join('\n')}\n`, 'utf8');
  console.log(`\nWrote ${rows} rows → ${path.relative(ROOT, OUT_FILE)}`);
}

main();
