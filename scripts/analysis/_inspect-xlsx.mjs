#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const args = process.argv.slice(2);
const target = args[0] ? path.resolve(args[0]) : path.join(ROOT, 'data', 'uscis-i526', '_suzanne_eb5_backlog.xlsx');
const maxRows = Number(args[1] || 12);

console.log(`Inspecting: ${target}`);
const wb = XLSX.readFile(target, { cellDates: false, cellNF: true });
console.log(`\n=== Sheets (${wb.SheetNames.length}) ===\n`);
for (const name of wb.SheetNames) {
  const sh = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: null, raw: false });
  const cols = rows.reduce((n, r) => Math.max(n, r?.length ?? 0), 0);
  const nonEmpty = rows.filter(r => r && r.some(c => c !== null && c !== ''));
  console.log(`--- ${name}   total rows=${rows.length}  cols_max=${cols}  non_empty=${nonEmpty.length} ---`);
  const head = nonEmpty.slice(0, maxRows);
  head.forEach((r, i) => {
    const parts = r.slice(0, Math.min(12, cols)).map(c => {
      const s = c === null ? '' : String(c);
      return s.length > 40 ? s.slice(0, 38) + '..' : s;
    });
    const idx = (rows.indexOf(nonEmpty[i]) + 1).toString().padStart(3, '0');
    console.log(`  [${idx}]`, parts.map(s => JSON.stringify(s)).join(', '));
  });
  // Tail rows
  const tail = nonEmpty.slice(-Math.min(6, nonEmpty.length));
  if (tail.length > 0 && tail[0] !== head[head.length - 1]) {
    console.log(`  ... (truncated) ...`);
    tail.forEach((r) => {
      const parts = r.slice(0, Math.min(12, cols)).map(c => {
        const s = c === null ? '' : String(c);
        return s.length > 40 ? s.slice(0, 38) + '..' : s;
      });
      const idx = (rows.indexOf(r) + 1).toString().padStart(3, '0');
      console.log(`  [${idx}]`, parts.map(s => JSON.stringify(s)).join(', '));
    });
  }
  console.log('');
}
