/**
 * Shared USCIS I-485 inventory workbook parser.
 * Used by ingest-i485.mjs and export-i485-csv.mjs.
 */
import path from 'node:path';
import { createRequire } from 'node:module';

const XLSX = createRequire(import.meta.url)('xlsx');

export const COUNTRY_BY_SHEET = {
  'Rest of the World': 'rest_of_world',
  China: 'china',
  'India (EB1 EW3 EB4 CRW EB5)': 'india',
  'India (EB2 EB3)': 'india',
  Mexico: 'mexico',
  Philippines: 'philippines',
};

export const CATEGORY_MAP = {
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

export const STATUS_MAP = {
  Available: 'available',
  'Awaiting Availability': 'awaiting',
};

export const MONTHS = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

const normSheetName = (s) => s.replace(/_/g, ' ').replace('How to-Read', 'How to Read');

/** Parse one USCIS XLSX into normalized non-zero cells. */
export function parseWorkbook(filePath) {
  const wb = XLSX.readFile(filePath, { dense: true });
  const cells = [];
  let cellCount = 0;
  for (const rawName of wb.SheetNames) {
    const country = COUNTRY_BY_SHEET[normSheetName(rawName)];
    if (!country) continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[rawName], { header: 1, raw: false });

    const headerIdx = rows.findIndex(
      (r) => r && String(r[0] ?? '').trim() === 'Country Of Chargeability',
    );
    if (headerIdx < 0) {
      throw new Error(`${path.basename(filePath)} / ${rawName}: header row not found`);
    }

    const header = rows[headerIdx].map((c) => String(c ?? '').trim());
    if (
      header[1] !== 'Preference Category' ||
      header[2] !== 'Visa Status' ||
      header[3] !== 'Priority Date Month'
    ) {
      throw new Error(
        `${path.basename(filePath)} / ${rawName}: unexpected header ${header.slice(0, 4)}`,
      );
    }

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
        if (!raw || raw === '-') continue;
        cellCount += 1;
        if (raw === 'D') {
          cells.push({
            country,
            category,
            visa_status: visaStatus,
            pd_year: year,
            pd_month: pdMonth,
            count: null,
            suppressed: true,
          });
        } else {
          const n = Number(raw.replace(/,/g, ''));
          if (!Number.isFinite(n)) throw new Error(`${rawName} row ${r}: bad value ${raw}`);
          if (n === 0) continue;
          cells.push({
            country,
            category,
            visa_status: visaStatus,
            pd_year: year,
            pd_month: pdMonth,
            count: n,
            suppressed: false,
          });
        }
      }
    }
  }
  return { cells, cellCount };
}
