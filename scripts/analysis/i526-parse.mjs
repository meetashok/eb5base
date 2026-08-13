#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'data', 'uscis-i526');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');

const TEA_ALIASES = new Map([
  [/rural area and high unemployment area combined|rural & high unemployment|rural area and high unemployment area/i, 'RURAL_AND_HIGH_UNEMPLOYMENT'],
  [/high unemployment/i, 'HIGH_UNEMPLOYMENT'],
  [/rural area/i, 'RURAL'],
  [/infrastructure/i, 'INFRASTRUCTURE'],
  [/unreserved|not set aside|no set-aside|no set aside/i, 'UNRESERVED'],
  [/^unknown$/i, 'UNKNOWN_TEA'],
  [/direct|standalone/i, 'DIRECT'],
]);
const TEA_DEFAULT_FOR_SUBTOTAL = null;

const COUNTRY_ALIASES = new Map([
  [/^total$|^·$/i, null],
  [/peoples? republic of china|mainland china|pr china/i, 'china'],
  [/^china$/i, 'china'],
  [/^india$/i, 'india'],
  [/viet *nam|vietnam/i, 'vietnam'],
  [/republic of korea|korea.*south|south korea/i, 'korea_south'],
  [/^korea$/i, 'korea_south'],
  [/taiwan|roc.*taiwan|chinese taipei/i, 'taiwan'],
  [/rest of (the )?world|all other|other countries|^other$/i, 'rest_of_the_world'],
]);

const CANONICAL_COUNTRIES = new Set(['china', 'india', 'korea_south', 'taiwan', 'vietnam', 'rest_of_the_world']);

const MONTH_COL_RE = /^([A-Za-z]+)[\s-]*-[\s-]*Quarter[\s-]*(\d)$/i;

const FORM_TYPE_FOR_SHEET_FALLBACK = [
  [/^I-526E\b/i, 'I526E'],
  [/^I-526\b/i, 'I526'],
];

function inferFormTypeForSheet(sheetName) {
  for (const [re, form] of FORM_TYPE_FOR_SHEET_FALLBACK) {
    if (re.test(sheetName)) return form;
  }
  return null;
}

function resolveDatasetASheets(wb, entry) {
  if (entry && Array.isArray(entry.form_sheets) && entry.form_sheets.length > 0) {
    const result = entry.form_sheets.filter(n => wb.SheetNames.includes(n));
    if (result.length === 0) {
      throw new Error(`None of configured form_sheets [${entry.form_sheets.join(',')}] found in workbook. Available sheets: ${wb.SheetNames.join(',')}`);
    }
    return result;
  }
  const canonical = ['I-526 Summary', 'I-526E Summary'].filter(n => wb.SheetNames.includes(n));
  if (canonical.length > 0) return canonical;
  // Fallback: all sheets matching I-526 prefix
  return wb.SheetNames.filter(n => /^I-526/.test(n));
}

const FORM_CODE_FOR_DATASET_B = {
  'I-5269': 'I526_LEGACY_PRE_RIA',
  'I-526': 'I526_STANDALONE',
  'I-526E': 'I526E',
  'I-829': 'I829',
  'I-95611': 'I956',
  'I-956F': 'I956F',
  'I-956G': 'I956G',
  'I-956H': 'I956H',
  'I-956K': 'I956K',
};

function norm(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && !isFinite(v)) return null;
  const s = String(v).trim();
  if (s === '' || s === '·' || s === '-' || s === '—' || s === 'N/A' || s === 'N\\A') return null;
  return s;
}

function parseCount(cell, { allowSuppressed = true } = {}) {
  const s = norm(cell);
  if (s === null) return { value: 0, suppressed: false, zero: true };
  if (!isNaN(Number(s.replaceAll(',', '')))) {
    const n = Math.trunc(Number(s.replaceAll(',', '')));
    return { value: n, suppressed: false, zero: n === 0 };
  }
  if (allowSuppressed) {
    const sup = /^[DH]$|^D\*$|^H\*$/.test(s);
    if (sup) return { value: null, suppressed: true, zero: false };
    if (/^[DH].*$/.test(s)) return { value: null, suppressed: true, zero: false };
  }
  if (s === '-' || s === '·' || s === '—') return { value: 0, suppressed: false, zero: true };
  return { value: NaN, suppressed: false, zero: false, raw: s };
}

function teaFromInvestmentType(label) {
  const l = norm(label);
  if (!l) return null;
  const noSuffix = l.replace(/\s*total$/i, '').trim();
  for (const [re, tea] of TEA_ALIASES) {
    if (re.test(noSuffix)) return tea;
  }
  return 'OTHER';
}

function countryFromLabel(label) {
  const l = norm(label);
  if (!l) return null;
  for (const [re, c] of COUNTRY_ALIASES) {
    if (re.test(l)) return c;
  }
  // Everything else collapses into rest_of_the_world (matches lib FilingCountry enum)
  return 'rest_of_the_world';
}

function parseFiscalYearFromFyString(titleText) {
  const m = /Fiscal Year\s+20(\d\d)/i.exec(titleText ?? '');
  return m ? Number('20' + m[1]) : null;
}

function parseMonthYearHeader(headerCell, fiscalYear) {
  const s = norm(headerCell);
  if (!s) return null;
  const m = MONTH_COL_RE.exec(s);
  if (!m) return null;
  const monthName = m[1];
  const monthIndex = new Date(Date.UTC(2024, 0, 1)).constructor(
    Date.parse(`${m[1]} 1, 2024 UTC`)
  );
  const d = new Date(Date.parse(`${monthName} 1, 2024 UTC`));
  if (isNaN(d.getTime())) return null;
  const monthNum = d.getUTCMonth() + 1;
  // USCIS fiscal year: Oct = FY-year, Sep = end. So month in [Oct,Nov,Dec] belongs to fiscalYear's calendar year (Oct=2025 for FY2026), Jan-Sep to calendar year = fiscalYear.
  const calYear = monthNum >= 10 ? fiscalYear - 1 : fiscalYear;
  const qNum = Number(m[2]);
  return { monthNum, quarterNum: qNum, calYear, fiscalYear, label: s };
}

function parseDatasetAWorkbook(absPath, asOfQuarter, entry) {
  const [, fyStr, qStr] = /^FY(\d{4})Q(\d)$/.exec(asOfQuarter) ?? [];
  const targetFY = Number(fyStr);
  const targetQ = Number(qStr);
  const wb = XLSX.readFile(absPath, { cellDates: false, cellNF: true });
  const cells = [];
  const sheetTotals = [];
  const sheetNames = resolveDatasetASheets(wb, entry ?? {});
  for (const sheetName of sheetNames) {
    const formType = inferFormTypeForSheet(sheetName);
    if (!formType) {
      console.warn(`  [parse warn] A sheet=${sheetName}: could not map to a form type, skipping`);
      continue;
    }
    const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null, raw: false });
    const titleLine = norm(rawRows[0]?.[0]) ?? '';
    const sheetFY = parseFiscalYearFromFyString(titleLine) ?? targetFY;
    // For annual workbooks, FY on each sheet may differ from the quarter entry, so honor sheet's FY when assigning calendar year.
    const effectiveFY = sheetFY && !Number.isNaN(sheetFY) ? sheetFY : targetFY;
    const headerRowIndex = 3;
    const headerRow = rawRows[headerRowIndex] ?? [];
    // Build month headers from columns that match "<Month> - Quarter <N>"
    const colMeta = []; // { colIndex, monthYear? }
    for (let i = 2; i < headerRow.length; i++) {
      const h = headerRow[i];
      if (norm(h) === null) continue;
      if (norm(h).toLowerCase() === 'total') {
        colMeta.push({ colIndex: i, isTotal: true });
        continue;
      }
      const my = parseMonthYearHeader(h, effectiveFY);
      if (my) colMeta.push({ colIndex: i, monthYear: my });
    }
    let currentTea = null;
    let sheetGrandTotal = 0;
    let sheetSuppressedCount = 0;

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;
      const c0 = norm(row[0]);
      if (!c0) continue;
      // Skip "TOTAL" lines (we use their total for QA, not emit cells)
      if (/^TOTAL$/i.test(c0)) {
        const lastColIdx = colMeta[colMeta.length - 1]?.colIndex ?? row.length - 1;
        const tc = parseCount(row[lastColIdx]);
        if (tc.value != null) sheetGrandTotal += tc.value;
        continue;
      }
      // Category "Total" subtotal lines (e.g. "High Unemployment Area Total") — skip emitting cells but keep TEA current
      const isTeaSubtotal = /total$/i.test(c0);
      const teaFromThisRow = teaFromInvestmentType(c0);
      if (teaFromThisRow) currentTea = teaFromThisRow;
      const countryLabel = norm(row[1]);
      // Only emit cells when there is a COUNTRY (not subtotal rows, not TEA headers)
      if (isTeaSubtotal || countryLabel === null) continue;
      const country = countryFromLabel(countryLabel);
      if (!country) continue;
      const tea = currentTea ?? 'OTHER';

      for (const cm of colMeta) {
        if (cm.isTotal) continue;
        const { monthYear } = cm;
        if (!monthYear) continue;
        // Only extract months that belong to the target FY + quarter
        if (monthYear.fiscalYear !== targetFY || monthYear.quarterNum !== targetQ) continue;
        const cell = row[cm.colIndex];
        const parsed = parseCount(cell);
        if (Number.isNaN(parsed.value) && !parsed.suppressed) {
          console.warn(`  [parse warn] A sheet=${sheetName} row#${r + 1} col=${cm.colIndex}(${monthYear.label}) country=${country} tea=${tea} unparseable value="${norm(cell)}"`);
          continue;
        }
        if (parsed.suppressed) sheetSuppressedCount++;
        if (parsed.zero && !parsed.suppressed) continue;
        cells.push({
          form_type: formType,
          country,
          tea_category: tea,
          receipt_year: monthYear.calYear,
          receipt_quarter: monthYear.quarterNum,
          receipt_month: monthYear.monthNum,
          count: parsed.value,
          suppressed: parsed.suppressed,
        });
      }
    }
    sheetTotals.push({ sheet: sheetName, grandTotalFromParsed: cells.filter(c => c.form_type === formType).reduce((a, b) => a + (b.count ?? 0), 0), suppressedCellsInSheet: cells.filter(c => c.form_type === formType && c.suppressed).length + sheetSuppressedCount });
  }
  return { cells, sheetTotals, workbookFY: targetFY, workbookQ: targetQ };
}

const Q_COLS = ['q_receipts', 'q_approvals', 'q_denials', 'q_completions', 'pending', 'median_processing_months', 'ytd_receipts', 'ytd_approvals'];
// Column order in the sheet: header row 5: [Category, Title, QRec, QApp, QDen, QComp, Pend, ProcTm, YRec, YApp, YDen, YComp, Pend]
// -> column indices, after the two left cols, are: 2 QRec, 3 QApp, 4 QDen, 5 QComp, 6 Pend, 7 ProcTime, 8 YRec, 9 YApp, 10 YDen, 11 YComp, 12 Pend (YTD pend)
// We only take the Q (first) half plus YTD Receipts/Approvals

function parseDatasetBWorkbook(absPath, asOfQuarter) {
  const wb = XLSX.readFile(absPath, { cellDates: false, cellNF: true });
  const sheetName = wb.SheetNames.find(n => /All_Forms$/i.test(n)) ?? wb.SheetNames.find(n => /AllForms$/i.test(n)) ?? wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null, raw: false });
  // Find the data header row: row containing text "Form Title" or "Description" in column index 1 (or anywhere)
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = (rows[i] ?? []).map(x => norm(x));
    if (cells.includes('Form Title') || cells.includes('Description')) { headerRow = i; break; }
  }
  if (headerRow < 0) throw new Error(`B workbook: could not locate header row with "Form Title"/"Description" in ${path.basename(absPath)}`);

  const ebRows = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const [codeCell] = rows[r] ?? [];
    const code = norm(codeCell);
    if (!code) continue;
    const key = code.replace(/[0-9]+$/, ''); // strip trailing footnote digits like "I-5269"→"I-526" then fallback to full string
    const mappedKey = FORM_CODE_FOR_DATASET_B[code];
    if (!mappedKey) {
      // stop once we've moved past EB-5 area (past row ~35). Keep collecting as long as we see I-*526/829/956.
      if (/^I-\d/.test(code)) continue;
      if (r > 50) break;
      continue;
    }
    const cells = rows[r];
    const qRec = parseCount(cells[2]);
    const qApp = parseCount(cells[3]);
    const qDen = parseCount(cells[4]);
    const qCom = parseCount(cells[5]);
    const pend = parseCount(cells[6]);
    const ptRaw = norm(cells[7]);
    const ptMonths = ptRaw === null ? null : Number(ptRaw.replace(',', ''));
    const yRec = parseCount(cells[8]);
    const yApp = parseCount(cells[9]);
    const anySup = [qRec, qApp, qDen, qCom, pend].some(x => x.suppressed) || false;
    ebRows.push({
      form_type: mappedKey,
      q_receipts: qRec.value,
      q_approvals: qApp.value,
      q_denials: qDen.value,
      q_completions: qCom.value,
      pending: pend.value,
      median_processing_months: isNaN(ptMonths) ? null : ptMonths,
      ytd_receipts: yRec.value,
      ytd_approvals: yApp.value,
      suppressed_q: anySup,
    });
  }
  if (ebRows.length === 0) {
    throw new Error(`B workbook: found zero EB-5 form rows in ${path.basename(absPath)}; check header/form detection`);
  }
  return { rows: ebRows, sheetName };
}

export function parseManifest() {
  const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  if (!raw.files || !Array.isArray(raw.files)) throw new Error('manifest missing files[]');
  for (const f of raw.files) {
    if (!['FILINGS_COUNTRY_TEA', 'ALL_FORMS_SUMMARY'].includes(f.dataset)) {
      throw new Error(`Unknown dataset ${f.dataset} in manifest`);
    }
  }
  return raw;
}

export function parseManifestEntry(entry) {
  const absPath = entry.file ? path.join(DATA_DIR, entry.file) : null;
  if (!absPath) return { cells: [], rows: [] };
  if (!fs.existsSync(absPath)) throw new Error(`Missing workbook: ${absPath}`);
  if (entry.dataset === 'FILINGS_COUNTRY_TEA') {
    return parseDatasetAWorkbook(absPath, entry.as_of_quarter, entry);
  }
  return parseDatasetBWorkbook(absPath, entry.as_of_quarter);
}

// CLI: dry-run report
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = parseManifest();
  console.log(`Manifest: ${manifest.files.length} entries; ${manifest.files.filter(e => e.dataset === 'FILINGS_COUNTRY_TEA').length} dataset A, ${manifest.files.filter(e => e.dataset === 'ALL_FORMS_SUMMARY').length} dataset B\n`);
  for (const e of manifest.files) {
    console.log(`=== ${e.as_of_quarter} ${e.dataset}  (${e.file ?? 'no workbook'}) ===`);
    const res = parseManifestEntry(e);
    if (e.dataset === 'FILINGS_COUNTRY_TEA') {
      console.log(`  filing cells: ${res.cells.length}`);
      for (const s of res.sheetTotals) console.log(`   - ${s.sheet}: sum(count)=${s.grandTotalFromParsed}  suppressed=${s.suppressedCellsInSheet}`);
      // Top 10 totals by tea/form_type/country
      const ag = new Map();
      for (const c of res.cells) {
        const k = `${c.form_type}/${c.tea_category}/${c.country}`;
        ag.set(k, (ag.get(k) ?? 0) + (c.count ?? 0));
      }
      const top = [...ag.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
      console.log('  top 8 buckets:', top.map(([k, v]) => `${k}=${v}`).join('  '));
    } else {
      console.log(`  form rows (Dataset B): ${res.rows.length}  (sheet=${res.sheetName})`);
      for (const row of res.rows) {
        const line = Q_COLS.map(k => `${k}=${row[k] ?? '·'}`).join(' ');
        console.log(`   - ${row.form_type}: ${line}  suppressed=${row.suppressed_q}`);
      }
    }
    console.log('');
  }
}
