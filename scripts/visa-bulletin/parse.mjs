// Parser for U.S. Department of State Visa Bulletin HTML -> structured
// employment-based cut-off rows (all EB categories, EB-5 split by sub-category).
//
// Source pages: travel.state.gov "visa-bulletin-for-<month>-<year>.html".
// Each bulletin has two employment tables (in document order):
//   1) Final Action Dates, 2) Dates for Filing.
// Columns: Worldwide (All Chargeability), China, India, Mexico, Philippines.
//
// This module is pure (html string in -> rows out) so it is unit-testable
// against the committed fixtures in ./fixtures. Run directly for a summary:
//   node scripts/visa-bulletin/parse.mjs scripts/visa-bulletin/fixtures/<file>.html

import * as cheerio from 'cheerio';
import { readFileSync } from 'node:fs';

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Normalize cell text: decode nbsp, collapse whitespace, trim. */
function norm(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Map a header cell to a country/chargeability code, or null. */
function headerToCountry(text) {
  const t = text.toLowerCase();
  if (t.includes('all chargeab')) return 'WORLDWIDE';
  if (t.includes('china')) return 'CHINA';
  if (t.includes('india')) return 'INDIA';
  if (t.includes('mexico')) return 'MEXICO';
  if (t.includes('philippin')) return 'PHILIPPINES';
  return null;
}

/**
 * Classify an employment row label -> { preference, subcategory } or null.
 * Handles historical EB-5 label variants (pre-RIA regional-center rows,
 * post-RIA unreserved + set-asides) and the standard EB-1..EB-4 rows.
 */
export function classifyEmploymentRow(rawLabel) {
  const l = norm(rawLabel).toLowerCase();
  if (!l) return null;

  // EB-5 (checked first; "fifth"/"5th").
  if (/\b5th\b|\bfifth\b/.test(l)) {
    if (l.includes('set aside') || l.includes('set-aside')) {
      if (l.includes('rural')) return { preference: 'EB5', subcategory: 'RURAL' };
      if (l.includes('high unemployment')) return { preference: 'EB5', subcategory: 'HIGH_UNEMPLOYMENT' };
      if (l.includes('infrastructure')) return { preference: 'EB5', subcategory: 'INFRASTRUCTURE' };
      return { preference: 'EB5', subcategory: 'SET_ASIDE_OTHER' };
    }
    if (l.includes('unreserved')) return { preference: 'EB5', subcategory: 'UNRESERVED' };
    // Order matters: "non-regional center" must be tested before "regional center".
    if (l.includes('non-regional center') || l.includes('non regional center')) {
      return { preference: 'EB5', subcategory: 'UNRESERVED' };
    }
    if (l.includes('regional center') || l.includes('pilot program') || l.includes('targeted employment')) {
      return { preference: 'EB5', subcategory: 'REGIONAL_CENTER' };
    }
    // Plain "5th" / "C5 and T5" base row.
    return { preference: 'EB5', subcategory: 'UNRESERVED' };
  }

  if (l.includes('other worker')) return { preference: 'EB3', subcategory: 'OTHER_WORKERS' };
  if (l.includes('religious')) return { preference: 'EB4', subcategory: 'RELIGIOUS_WORKERS' };

  if (/^1st\b|\bfirst\b/.test(l)) return { preference: 'EB1', subcategory: 'MAIN' };
  if (/^2nd\b|\bsecond\b/.test(l)) return { preference: 'EB2', subcategory: 'MAIN' };
  if (/^3rd\b|\bthird\b/.test(l)) return { preference: 'EB3', subcategory: 'PROFESSIONAL_SKILLED' };
  if (/^4th\b|\bfourth\b/.test(l)) return { preference: 'EB4', subcategory: 'MAIN' };

  return null;
}

/** Parse a cell value -> { status, cutoff } or null when not a data value. */
export function parseCellValue(raw) {
  const t = norm(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!t) return null;
  if (t === 'C' || t === 'CURRENT') return { status: 'CURRENT', cutoff: null };
  if (t === 'U' || t === 'UNAVAILABLE') return { status: 'UNAVAILABLE', cutoff: null };
  const m = t.match(/(\d{2})([A-Z]{3})(\d{2})/);
  if (m) {
    const day = Number(m[1]);
    const mon = MONTHS[m[2].toLowerCase()];
    const yy = Number(m[3]);
    if (mon && day >= 1 && day <= 31) {
      const year = yy >= 90 ? 1900 + yy : 2000 + yy;
      const iso = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { status: 'DATE', cutoff: iso };
    }
  }
  return null;
}

/** Extract a table as an array of rows, each an array of normalized cell texts. */
function tableToRows($, table) {
  const rows = [];
  $(table)
    .find('tr')
    .each((_i, tr) => {
      const cells = [];
      $(tr)
        .children('td,th')
        .each((_j, td) => cells.push(norm($(td).text())));
      if (cells.length) rows.push(cells);
    });
  return rows;
}

/**
 * Parse a bulletin's HTML into employment-based cut-off rows.
 * Returns { rows, meta } where each row is
 * { preference, subcategory, country, dateType, status, cutoff }.
 */
export function parseBulletinHtml(html, { month } = {}) {
  const $ = cheerio.load(html);

  // Collect employment tables in document order (header cell[0] mentions "employ").
  const empTables = [];
  $('table').each((_i, table) => {
    const rows = tableToRows($, table);
    if (!rows.length) return;
    const header = rows[0].map((c) => c.toLowerCase());
    const looksEmployment =
      header.some((c) => c.includes('employ')) &&
      rows.some((r) => classifyEmploymentRow(r[0])?.preference === 'EB5');
    if (looksEmployment) empTables.push(rows);
  });

  const out = [];
  const dateTypes = ['FINAL_ACTION', 'FILING'];
  empTables.slice(0, 2).forEach((rows, idx) => {
    const dateType = dateTypes[idx] ?? 'FILING';
    const header = rows[0];
    // Build column index -> country from the header; fall back to positional.
    let colCountry = {};
    header.forEach((c, ci) => {
      const country = headerToCountry(c);
      if (country) colCountry[ci] = country;
    });
    if (Object.keys(colCountry).length < 2) {
      colCountry = { 1: 'WORLDWIDE', 2: 'CHINA', 3: 'INDIA', 4: 'MEXICO', 5: 'PHILIPPINES' };
    }

    for (let ri = 1; ri < rows.length; ri++) {
      const row = rows[ri];
      const cls = classifyEmploymentRow(row[0]);
      if (!cls) continue;
      for (const [ciStr, country] of Object.entries(colCountry)) {
        const ci = Number(ciStr);
        const val = parseCellValue(row[ci]);
        if (!val) continue;
        out.push({
          preference: cls.preference,
          subcategory: cls.subcategory,
          country,
          dateType,
          status: val.status,
          cutoff: val.cutoff,
        });
      }
    }
  });

  return { rows: out, meta: { month: month ?? null, employmentTables: empTables.length } };
}

// ---- CLI self-summary ----
function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node parse.mjs <bulletin.html> [YYYY-MM]');
    process.exit(1);
  }
  const html = readFileSync(file, 'utf8');
  const { rows, meta } = parseBulletinHtml(html, { month: process.argv[3] });
  console.log('employment tables:', meta.employmentTables, '| rows:', rows.length);
  const eb5 = rows.filter((r) => r.preference === 'EB5');
  console.log('\nEB-5 rows:');
  for (const r of eb5) {
    console.log(
      `  ${r.dateType.padEnd(12)} ${r.subcategory.padEnd(18)} ${r.country.padEnd(11)} ` +
        `${r.status}${r.cutoff ? ' ' + r.cutoff : ''}`,
    );
  }
  const byPref = {};
  for (const r of rows) byPref[r.preference] = (byPref[r.preference] ?? 0) + 1;
  console.log('\nrows by preference:', byPref);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
