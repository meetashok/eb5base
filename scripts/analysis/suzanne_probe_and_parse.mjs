#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'data', 'uscis-i526');
const SUZANNE_XLSX = path.join(DATA_DIR, '_suzanne_eb5_backlog.xlsx');
const OUT_DIR = path.join(DATA_DIR, 'generated_suzanne');

const TEA_ALIASES = [
  [/rural area and high unemployment area combined|rural & high unemployment|rural area and high unemployment area|rural high-ue combined/i, 'RURAL_AND_HIGH_UNEMPLOYMENT'],
  [/high unemployment|high une|high-ue/i, 'HIGH_UNEMPLOYMENT'],
  [/rural area|rural are/i, 'RURAL'],
  [/infrastructure|infrastruc/i, 'INFRASTRUCTURE'],
  [/unreserved|unreserve|none|not set aside|no set aside|no set-aside/i, 'UNRESERVED'],
  [/unknown/i, 'UNKNOWN_TEA'],
  [/direct|standalone/i, 'DIRECT'],
];

function norm(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && !isFinite(v)) return null;
  const s = String(v).trim();
  if (s === '' || s === '·' || s === '-' || s === '—' || s === 'N/A') return null;
  return s;
}

function teaFromLabel(label) {
  const l = norm(label);
  if (!l) return null;
  const noSuffix = l.replace(/\s*total$/i, '').trim();
  for (const [re, tea] of TEA_ALIASES) {
    if (re.test(noSuffix)) return tea;
  }
  return 'OTHER';
}

function inferFormType(label) {
  const l = norm(label) ?? '';
  if (/^I-526E\b/i.test(l)) return 'I526E';
  if (/^I-526\b/i.test(l)) return 'I526';
  return null;
}

function parseMonthYearCombo(monYearCombo) {
  const s = norm(monYearCombo);
  if (!s) return null;
  const m = /^([A-Za-z]+)[-\s]*(\d{2}|\d{4})$/.exec(s);
  if (!m) return null;
  const [, monPart, yrPart] = m;
  const d = new Date(Date.parse(`${monPart} 1, 2024 UTC`));
  const monthNum = d.getUTCMonth() + 1;
  if (!monthNum || Number.isNaN(monthNum)) return null;
  let calYear = yrPart.length === 2 ? 2000 + Number(yrPart) : Number(yrPart);
  if (!Number.isFinite(calYear)) return null;
  let fiscalYear, quarterNum;
  if (monthNum >= 10) { fiscalYear = calYear + 1; quarterNum = 1; }
  else if (monthNum <= 3) { fiscalYear = calYear; quarterNum = 2; }
  else if (monthNum <= 6) { fiscalYear = calYear; quarterNum = 3; }
  else { fiscalYear = calYear; quarterNum = 4; }
  return { monthNum, calYear, fiscalYear, quarterNum };
}

function parseCount(cell) {
  const s = norm(cell);
  if (s === null) return { value: 0, suppressed: false };
  if (!isNaN(Number(String(s).replaceAll(',', '')))) {
    return { value: Math.trunc(Number(String(s).replaceAll(',', ''))), suppressed: false };
  }
  if (/^[DH]$|^D\*$|^H\*$/.test(s)) return { value: null, suppressed: true };
  if (/^[DH]/.test(s)) return { value: null, suppressed: true };
  return { value: NaN, suppressed: false, raw: s };
}

// Post-RIA sheet, row 22 header: Form, Filing Date (Month-YY), TEA, China, India, All ROW, South Korea, Taiwan, Vietnam, ROW except SK,T,V, ...
// We want 6 canonical countries. Vietnam is in col 8 (index 8). China=3, India=4, S.Korea=6, Taiwan=7, Vietnam=8, All ROW=5
// All ROW includes S.Korea, Taiwan, Vietnam + "ROW except SK,T,V" (col 9). So the actual rest_of_the_world canonical country is col 5 "All ROW" but wait:
// canonical countries are 6: china, india, korea_south, taiwan, vietnam, rest_of_the_world. All ROW = S.Korea + Taiwan + Vietnam + ROW except SK,T,V.
// Therefore rest_of_the_world canonical = All ROW (col 5) minus col 6 S.Korea - col 7 Taiwan - col 8 Vietnam. We can compute directly from row 9? No: per row, per month:
// The Post-RIA rows for Oct-24 294 I526E Oct24 High Unemp: cols [3..10] = "88","26","84","12","9","8","55". That is: China=88, India=26, All ROW=84, S.Korea=12, Taiwan=9, Vietnam=8, ROW except SK,T,V=55.
// So rest_of_the_world = ROW except SK,T,V (col 9) = index 9 (that's the last one before trailing columns). Actually sum 12+9+8+55=84 matches All ROW. Therefore 6 canonical columns:
//   china=idx3, india=idx4, korea_south=idx6, taiwan=idx7, vietnam=idx8, rest_of_the_world=idx9. Perfect 6 canonical mapping!

const COUNTRY_COL_ASSIGN = [
  { cIdx: 3, country: 'china' },
  { cIdx: 4, country: 'india' },
  { cIdx: 6, country: 'korea_south' },
  { cIdx: 7, country: 'taiwan' },
  { cIdx: 8, country: 'vietnam' },
  { cIdx: 9, country: 'rest_of_the_world' },
];

const TARGET_FY = 2025;
const TARGET_QUARTERS = new Set([1, 2]);

function parsePostRIASheet(sheetName, sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  const byRelease = new Map();
  let candidateRows = 0;
  let matchedRows = 0;
  const sampleMonths = new Set();
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 10) continue;
    const formRaw = norm(row[0]);
    const monthRaw = norm(row[1]);
    const teaRaw = norm(row[2]);
    if (!formRaw || !monthRaw || !teaRaw) continue;
    const form = inferFormType(formRaw);
    if (!form) continue;
    const monthYear = parseMonthYearCombo(monthRaw);
    if (!monthYear) continue;
    candidateRows++;
    sampleMonths.add(`${monthYear.calYear}-${monthYear.monthNum}`);
    if (!(monthYear.fiscalYear === TARGET_FY && TARGET_QUARTERS.has(monthYear.quarterNum))) continue;
    const tea = teaFromLabel(teaRaw);
    if (!tea) continue;
    matchedRows++;
    const releaseKey = `FY${monthYear.fiscalYear}Q${monthYear.quarterNum}`;
    if (!byRelease.has(releaseKey)) byRelease.set(releaseKey, { cells: [], suppressedTotal: 0 });
    const bucket = byRelease.get(releaseKey);
    for (const { cIdx, country } of COUNTRY_COL_ASSIGN) {
      const v = parseCount(row[cIdx]);
      if (v.suppressed) bucket.suppressedTotal++;
      if (v.value === 0 && !v.suppressed) continue;
      bucket.cells.push({
        form_type: form,
        tea_category: tea,
        country,
        receipt_year: monthYear.calYear,
        receipt_quarter: monthYear.quarterNum,
        receipt_month: monthYear.monthNum,
        count: v.value,
        suppressed: !!v.suppressed,
      });
    }
  }
  return { byRelease, candidateRows, matchedRows, sampleMonths: [...sampleMonths].sort().slice(0, 20) };
}

async function main() {
  if (!fs.existsSync(SUZANNE_XLSX)) {
    console.error('File missing: ' + SUZANNE_XLSX);
    process.exit(2);
  }
  const wb = XLSX.readFile(SUZANNE_XLSX, { cellDates: false });
  console.log('==> SHEETS: ' + wb.SheetNames.join(', '));
  const targetSheet = 'Post-RIA';
  if (!wb.SheetNames.includes(targetSheet)) {
    console.error('No Post-RIA sheet in workbook.');
    process.exit(5);
  }
  const parsed = parsePostRIASheet(targetSheet, wb.Sheets[targetSheet]);
  console.log(`Parsed ${targetSheet}: candidateRows=${parsed.candidateRows}, matchedTargetRows=${parsed.matchedRows}, sample months observed: ${parsed.sampleMonths.join(', ')}`);
  if (parsed.byRelease.size === 0) {
    console.error('No FY2025 Q1 / Q2 cells found. Nothing written.');
    process.exit(6);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [rk, bucket] of parsed.byRelease) {
    const metaOut = path.join(OUT_DIR, `suzanne_${rk}_meta.json`);
    const cellsOut = path.join(OUT_DIR, `suzanne_${rk}_cells.json`);
    const [, fyStr, qStr] = /^FY(\d{4})Q(\d)$/.exec(rk) ?? [];
    const fy = Number(fyStr);
    const q = Number(qStr);
    const qMonths = q === 1 ? [10, 11, 12] : q === 2 ? [1, 2, 3] : q === 3 ? [4, 5, 6] : [7, 8, 9];
    const calStart = q === 1 ? fy - 1 : fy;
    const calEnd = q === 4 ? fy : (q === 1 ? fy - 1 : fy);
    const endDay = q === 1 ? (qMonths[2] === 12 ? 31 : qMonths[2] === 11 ? 30 : 31) : q === 2 ? 28 : q === 3 ? 30 : 30;
    const published = q === 1 ? `${fy - 1}-12-15` : q === 2 ? `${fy}-03-15` : q === 3 ? `${fy}-06-15` : `${fy}-09-15`;
    const meta = {
      releaseKey: rk,
      period_start: `${calStart}-${String(qMonths[0]).padStart(2, '0')}-01`,
      period_end: `${calEnd}-${String(qMonths[2]).padStart(2, '0')}-${endDay}`,
      published_date: published,
      cellCount: bucket.cells.length,
      suppressedCellsTotal: bucket.suppressedTotal,
      sourceSheet: targetSheet,
    };
    fs.writeFileSync(metaOut, JSON.stringify(meta, null, 2));
    fs.writeFileSync(cellsOut, JSON.stringify({ cells: bucket.cells }, null, 2));
    const byForm = new Map();
    for (const c of bucket.cells) byForm.set(c.form_type, (byForm.get(c.form_type) ?? 0) + (c.count ?? 0));
    console.log(`  ${rk}: wrote ${meta.cellCount} cells, suppressed=${bucket.suppressedTotal}. totals by form: ${[...byForm.entries()].map(([k,v])=>`${k}=${v}`).join(', ')}`);
    console.log(`    meta -> ${metaOut}`);
    console.log(`    cells -> ${cellsOut}`);
    console.log('    samples:');
    bucket.cells.slice(0, 4).forEach((c, i) => console.log(`      [${i}]`, JSON.stringify(c)));
  }
  console.log('\n✅  Parse complete. Next run: node scripts/analysis/ingest-suzanne-i526-gap.mjs (--dry-run first).');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
