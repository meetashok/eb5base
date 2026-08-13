import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase-env';

export const I526_QUARTERLY_CSV_PATH = '/data/i526-quarterly.csv';
export const I526_PROCESSING_SUMMARY_CSV_PATH = '/data/i526-processing-summary.csv';

export const I526_DATASETS = {
  FILINGS_COUNTRY_TEA: 'FILINGS_COUNTRY_TEA',
  ALL_FORMS_SUMMARY: 'ALL_FORMS_SUMMARY',
} as const;
export type I526DatasetId = (typeof I526_DATASETS)[keyof typeof I526_DATASETS];

export const I526_QUARTER_LABELS = [
  { key: 'Q1', months: 'Oct-Dec', fySuffix: ' FY' },
  { key: 'Q2', months: 'Jan-Mar', fySuffix: ' FY' },
  { key: 'Q3', months: 'Apr-Jun', fySuffix: ' FY' },
  { key: 'Q4', months: 'Jul-Sep', fySuffix: ' FY' },
] as const;

export const USCIS_DATA_LIBRARY_URL =
  'https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data';

// ---------------------------------------------------------------------------
// Domain types (mirror Supabase columns)
// ---------------------------------------------------------------------------

export interface I526Release {
  id: number;
  dataset: I526DatasetId;
  as_of_quarter: string;
  period_start: string;
  period_end: string;
  published_date: string | null;
  source_url: string;
  source_title: string;
  source_note: string | null;
}

export type FilingFormType = 'I526' | 'I526E' | 'COMBINED';

export type TeaCategory =
  | 'RURAL'
  | 'HIGH_UNEMPLOYMENT'
  | 'RURAL_AND_HIGH_UNEMPLOYMENT'
  | 'INFRASTRUCTURE'
  | 'UNRESERVED'
  | 'UNKNOWN_TEA'
  | 'DIRECT'
  | 'PRE_RIA_UNKNOWN'
  | 'OTHER';

export type FilingCountry =
  | 'china'
  | 'india'
  | 'korea_south'
  | 'taiwan'
  | 'vietnam'
  | 'rest_of_the_world';

export interface I526FilingCell {
  release_id: number;
  country: FilingCountry | string;
  form_type: FilingFormType;
  tea_category: TeaCategory;
  receipt_year: number | null;
  receipt_quarter: number | null;
  receipt_month: number | null;
  count: number | null;
  suppressed: boolean;
}

export type ProcessingFormType =
  | 'I526_LEGACY_PRE_RIA'
  | 'I526_STANDALONE'
  | 'I526E'
  | 'I829'
  | 'I956'
  | 'I956F'
  | 'I956G'
  | 'I956H'
  | 'I956K';

export interface I526ProcessingRow {
  release_id: number;
  form_type: ProcessingFormType;
  q_receipts: number | null;
  q_approvals: number | null;
  q_denials: number | null;
  q_completions: number | null;
  ytd_receipts: number | null;
  ytd_approvals: number | null;
  pending: number | null;
  suppressed_q: boolean;
  median_processing_months: number | null;
}

// ---------------------------------------------------------------------------
// Enum -> label maps
// ---------------------------------------------------------------------------

export const FILING_FORM_LABELS: Record<FilingFormType, string> = {
  I526: 'I-526 standalone',
  I526E: 'I-526E (RC)',
  COMBINED: 'I-526 + I-526E (combined)',
};

export const PROCESSING_FORM_LABELS: Record<ProcessingFormType, string> = {
  I526_LEGACY_PRE_RIA: 'I-526 legacy (pre-RIA)',
  I526_STANDALONE: 'I-526 standalone',
  I526E: 'I-526E Regional Center',
  I829: 'I-829 Remove conditions',
  I956: 'I-956 RC certification',
  I956F: 'I-956F RC project amendment',
  I956G: 'I-956G RC termination',
  I956H: 'I-956H RC personnel',
  I956K: 'I-956K NCE',
};

export const TEA_LABELS: Record<TeaCategory, string> = {
  RURAL: 'Rural',
  HIGH_UNEMPLOYMENT: 'High unemployment',
  RURAL_AND_HIGH_UNEMPLOYMENT: 'Rural & High-UE combined',
  INFRASTRUCTURE: 'Infrastructure',
  UNRESERVED: 'Unreserved',
  UNKNOWN_TEA: 'Unknown / Unclassified',
  DIRECT: 'Direct',
  PRE_RIA_UNKNOWN: 'Pre-RIA unknown',
  OTHER: 'Other',
};

export const COUNTRY_LABELS: Record<FilingCountry, string> = {
  china: 'China',
  india: 'India',
  korea_south: 'South Korea',
  taiwan: 'Taiwan',
  vietnam: 'Vietnam',
  rest_of_the_world: 'Rest of the World',
};

export function countryLabel(value: string): string {
  return (
    (COUNTRY_LABELS as Record<string, string>)[value] ??
    value
      .split('_')
      .map((w) => (w === 'of' || w === 'the' ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ')
  );
}

// ---------------------------------------------------------------------------
// Filter groups (GROUP -> members pattern, mirroring CATEGORY_OPTIONS in i485.ts)
// ---------------------------------------------------------------------------

export interface FilterOption<T> {
  value: T;
  label: string;
  members?: string[];
}

// --- Dataset A: Form type filter ---
export const FORM_A_ALL: FilingFormType[] = ['I526', 'I526E'];

export const FORM_FILTERS_A: FilterOption<string>[] = [
  { value: 'ALL_A', label: 'All filings (I-526 + I-526E)', members: FORM_A_ALL },
  { value: 'I526', label: 'I-526 standalone', members: ['I526'] },
  { value: 'I526E', label: 'I-526E (Regional Center)', members: ['I526E'] },
];

export const DEFAULT_FORM_A: string[] = ['I526E'];

// --- Dataset A: TEA category filter ---
export const SET_ASIDE_TEAS: TeaCategory[] = [
  'RURAL',
  'HIGH_UNEMPLOYMENT',
  'RURAL_AND_HIGH_UNEMPLOYMENT',
  'INFRASTRUCTURE',
];
export const ALL_EXCEPT_UNKNOWN: TeaCategory[] = [
  ...SET_ASIDE_TEAS,
  'UNRESERVED',
  'DIRECT',
  'PRE_RIA_UNKNOWN',
  'OTHER',
];

export const TEA_FILTER_OPTIONS: FilterOption<string>[] = [
  { value: 'RURAL', label: 'Rural', members: ['RURAL'] },
  {
    value: 'HIGH_UNEMPLOYMENT',
    label: 'HUA',
    members: ['HIGH_UNEMPLOYMENT'],
  },
  {
    value: 'RURAL_AND_HIGH_UNEMPLOYMENT',
    label: 'Rural & HUA',
    members: ['RURAL_AND_HIGH_UNEMPLOYMENT'],
  },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure', members: ['INFRASTRUCTURE'] },
  { value: 'UNRESERVED', label: 'Unreserved', members: ['UNRESERVED'] },
  { value: 'UNKNOWN_TEA', label: 'Unknown', members: ['UNKNOWN_TEA'] },
];

export const DEFAULT_TEA: string[] = [
  'RURAL',
  'HIGH_UNEMPLOYMENT',
  'RURAL_AND_HIGH_UNEMPLOYMENT',
  'UNRESERVED',
];

export const TEA_GROUP_FILTERS = new Set<string>([]);
export const TEA_SET_ASIDE_FILTERS = new Set([
  'RURAL',
  'HIGH_UNEMPLOYMENT',
  'RURAL_AND_HIGH_UNEMPLOYMENT',
  'INFRASTRUCTURE',
]);
export const TEA_OTHER_FILTERS = new Set(['UNRESERVED', 'UNKNOWN_TEA']);
export const IS_TEA_GROUP_OR_SET_ASIDE = new Set([
  ...TEA_GROUP_FILTERS,
  ...TEA_SET_ASIDE_FILTERS,
]);

// --- Dataset A: Country filter ---
export const ALL_COUNTRIES: FilingCountry[] = [
  'china',
  'india',
  'korea_south',
  'taiwan',
  'vietnam',
  'rest_of_the_world',
];

export const COUNTRY_FILTER_OPTIONS: FilterOption<string>[] = [
  { value: 'ALL_COUNTRIES', label: 'All', members: ALL_COUNTRIES },
  ...ALL_COUNTRIES.map((c) => ({
    value: c,
    label: countryLabel(c),
    members: [c],
  })),
];

export const DEFAULT_COUNTRIES: string[] = ['ALL_COUNTRIES'];

// --- Dataset B: Form type filter ---
export const KEY_PETITION_FORMS: ProcessingFormType[] = [
  'I526_LEGACY_PRE_RIA',
  'I526_STANDALONE',
  'I526E',
  'I829',
];
export const I956_SUB_FORMS: ProcessingFormType[] = [
  'I956',
  'I956F',
  'I956G',
  'I956H',
  'I956K',
];
export const ALL_PROCESSING_FORMS: ProcessingFormType[] = [
  ...KEY_PETITION_FORMS,
  ...I956_SUB_FORMS,
];

export const FORM_FILTERS_B: FilterOption<string>[] = [
  { value: 'ALL_EB5_B', label: 'All EB-5 forms', members: ALL_PROCESSING_FORMS },
  {
    value: 'KEY_PETITIONS',
    label: 'Key petitions only',
    members: KEY_PETITION_FORMS,
  },
  {
    value: 'I526_LEGACY_PRE_RIA',
    label: 'I-526 legacy pre-RIA',
    members: ['I526_LEGACY_PRE_RIA'],
  },
  {
    value: 'I526_STANDALONE',
    label: 'I-526 standalone',
    members: ['I526_STANDALONE'],
  },
  { value: 'I526E', label: 'I-526E (RC)', members: ['I526E'] },
  { value: 'I829', label: 'I-829', members: ['I829'] },
  { value: 'ALL_I956', label: 'All I-956 family', members: I956_SUB_FORMS },
  ...I956_SUB_FORMS.map((f) => ({
    value: f,
    label: PROCESSING_FORM_LABELS[f],
    members: [f],
  })),
];

export const DEFAULT_FORM_B: string[] = ['KEY_PETITIONS'];
export const DEFAULT_FORM_B_SINGLE: string = 'I526E';

// ---------------------------------------------------------------------------
// Group -> members resolution (mirrors categoryMembersForMany in i485.ts)
// ---------------------------------------------------------------------------

export function membersForFilterOption<T extends string>(
  options: FilterOption<T>[],
  value: string,
): string[] {
  return options.find((o) => o.value === value)?.members ?? [value];
}

export function resolveFilterMembers<T extends string>(
  options: FilterOption<T>[],
  values: string[],
): string[] {
  const set = new Set<string>();
  for (const v of values) {
    for (const m of membersForFilterOption(options, v)) set.add(m);
  }
  return Array.from(set);
}

// ---------------------------------------------------------------------------
// TEA exclusivity toggle rules (simplified: leaf-only multi-select; no groups)
// ---------------------------------------------------------------------------

export function toggleTeaFilter(current: string[], next: string): string[] {
  if (current.includes(next)) {
    const without = current.filter((v) => v !== next);
    return without.length > 0 ? without : [...DEFAULT_TEA];
  }
  return [...current, next];
}

// ---------------------------------------------------------------------------
// Country exclusivity toggle rules (All vs individual)
// ---------------------------------------------------------------------------

export function toggleCountryFilter(current: string[], next: string): string[] {
  if (next === 'ALL_COUNTRIES') {
    return current.length === 1 && current[0] === next
      ? [...DEFAULT_COUNTRIES]
      : ['ALL_COUNTRIES'];
  }
  // Any individual country -> drop ALL_COUNTRIES, toggle the individual one
  const withoutAll = current.filter((v) => v !== 'ALL_COUNTRIES');
  if (withoutAll.includes(next)) {
    const out = withoutAll.filter((v) => v !== next);
    return out.length > 0 ? out : ['ALL_COUNTRIES'];
  }
  return [...withoutAll, next];
}

// ---------------------------------------------------------------------------
// Form A/B toggle rules (single-select-group behavior for now for A since
// combining ALL + subset is awkward; multi-select for B groups)
// ---------------------------------------------------------------------------

export function toggleFormAFilter(current: string[], next: string): string[] {
  if (current.includes(next)) {
    return current.length === 1 ? [...DEFAULT_FORM_A] : current.filter((v) => v !== next);
  }
  // ALL_A is exclusive
  if (next === 'ALL_A') return [next];
  return [...current.filter((v) => v !== 'ALL_A'), next];
}

export function toggleFormBFilter(current: string[], next: string): string[] {
  const groupValues = new Set(['ALL_EB5_B', 'KEY_PETITIONS', 'ALL_I956']);
  if (groupValues.has(next)) {
    if (current.includes(next)) {
      const without = current.filter((v) => v !== next);
      return without.length > 0 ? without : [...DEFAULT_FORM_B];
    }
    const withoutOtherGroups = current.filter((v) => !groupValues.has(v));
    return [...withoutOtherGroups, next];
  }
  if (current.includes(next)) {
    const without = current.filter((v) => v !== next);
    return without.length > 0 ? without : [...DEFAULT_FORM_B];
  }
  const withoutGroups = current.filter(() => !groupValues.has(next));
  return [...withoutGroups, next];
}

// ---------------------------------------------------------------------------
// Fetchers (mirror fetchI485Releases / fetchI485Cells, paged)
// ---------------------------------------------------------------------------

function clientOrBrowser(client?: SupabaseClient) {
  return client ?? createClient();
}

export function isI526DataAvailable(): boolean {
  return isSupabaseConfigured();
}

const PAGE = 1000;

export async function fetchI526Releases(
  dataset?: I526DatasetId,
  client?: SupabaseClient,
): Promise<I526Release[]> {
  const supabase = clientOrBrowser(client);
  let q = supabase
    .from('i526_releases')
    .select(
      'id, dataset, as_of_quarter, period_start, period_end, published_date, source_url, source_title, source_note',
    )
    .order('period_end', { ascending: true });
  if (dataset) q = q.eq('dataset', dataset);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as I526Release[];
}

export interface FilingCellFilters {
  releaseIds?: number[];
  formTypes?: FilingFormType[];
  teas?: TeaCategory[];
  countries?: (FilingCountry | string)[];
  receiptYear?: number;
  receiptQuarter?: number;
}

export async function fetchI526FilingCells(
  filters: FilingCellFilters,
  client?: SupabaseClient,
): Promise<I526FilingCell[]> {
  const supabase = clientOrBrowser(client);
  const out: I526FilingCell[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from('i526_filing_cells')
      .select(
        'release_id, country, form_type, tea_category, receipt_year, receipt_quarter, receipt_month, count, suppressed',
      )
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (filters.releaseIds && filters.releaseIds.length > 0) {
      q = q.in('release_id', filters.releaseIds);
    }
    if (filters.formTypes && filters.formTypes.length > 0) {
      q = q.in('form_type', filters.formTypes);
    }
    if (filters.teas && filters.teas.length > 0) {
      q = q.in('tea_category', filters.teas);
    }
    if (filters.countries && filters.countries.length > 0) {
      q = q.in('country', filters.countries);
    }
    if (filters.receiptYear != null) q = q.eq('receipt_year', filters.receiptYear);
    if (filters.receiptQuarter != null) q = q.eq('receipt_quarter', filters.receiptQuarter);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as I526FilingCell[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export interface ProcessingFilters {
  releaseIds?: number[];
  formTypes?: ProcessingFormType[];
}

export async function fetchI526Processing(
  filters: ProcessingFilters,
  client?: SupabaseClient,
): Promise<I526ProcessingRow[]> {
  const supabase = clientOrBrowser(client);
  let q = supabase
    .from('i526_processing_summary')
    .select(
      'release_id, form_type, q_receipts, q_approvals, q_denials, q_completions, ytd_receipts, ytd_approvals, pending, suppressed_q, median_processing_months',
    )
    .order('release_id', { ascending: true });
  if (filters.releaseIds && filters.releaseIds.length > 0) {
    q = q.in('release_id', filters.releaseIds);
  }
  if (filters.formTypes && filters.formTypes.length > 0) {
    q = q.in('form_type', filters.formTypes);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as I526ProcessingRow[];
}

// ---------------------------------------------------------------------------
// Shared bucket aggregation (like AggregatedBucket in i485.ts)
// ---------------------------------------------------------------------------

export interface AggregatedBucket {
  count: number;
  suppressedCells: number;
}

export function aggregateFilingBucketsBy<K extends string | number>(
  cells: I526FilingCell[],
  keyFn: (c: I526FilingCell) => K,
): Map<K, AggregatedBucket> {
  const map = new Map<K, AggregatedBucket>();
  for (const c of cells) {
    const k = keyFn(c);
    const bucket = map.get(k) ?? { count: 0, suppressedCells: 0 };
    if (c.suppressed) bucket.suppressedCells += 1;
    else bucket.count += c.count ?? 0;
    map.set(k, bucket);
  }
  return map;
}

export function sumBuckets(buckets: Iterable<AggregatedBucket>): AggregatedBucket {
  const out: AggregatedBucket = { count: 0, suppressedCells: 0 };
  for (const b of buckets) {
    out.count += b.count;
    out.suppressedCells += b.suppressedCells;
  }
  return out;
}

export function totalWithSuppressedNote(bucket: AggregatedBucket): {
  count: number;
  suppressedCells: number;
  note: string | null;
} {
  const note =
    bucket.suppressedCells > 0
      ? `plus ${bucket.suppressedCells} suppressed cell${bucket.suppressedCells === 1 ? '' : 's'} (actual total up to ${bucket.suppressedCells * 9} higher)`
      : null;
  return { count: bucket.count, suppressedCells: bucket.suppressedCells, note };
}

// ---------------------------------------------------------------------------
// Quarter label helpers (as_of_quarter -> human labels + period bounds)
// ---------------------------------------------------------------------------

export function parseAsOfQuarter(q: string): { fiscalYear: number; quarter: number } | null {
  const m = /^FY(\d{4})Q(\d)$/.exec(q);
  if (!m) return null;
  return { fiscalYear: Number(m[1]), quarter: Number(m[2]) };
}

export function quarterLabelForAsOf(asOfQuarter: string): {
  fyLabel: string;
  monthsLabel: string;
  periodStart: string | null;
  periodEnd: string | null;
} {
  const parsed = parseAsOfQuarter(asOfQuarter);
  const qLabel = I526_QUARTER_LABELS[(parsed?.quarter ?? 1) - 1];
  if (!parsed || !qLabel) {
    return {
      fyLabel: asOfQuarter,
      monthsLabel: '',
      periodStart: null,
      periodEnd: null,
    };
  }
  const { fiscalYear, quarter } = parsed;
  const calYearForQ1 = fiscalYear - 1;
  const startMap = new Map<number, [number, number, number]>([
    [1, [calYearForQ1, 10, 1]],
    [2, [fiscalYear, 1, 1]],
    [3, [fiscalYear, 4, 1]],
    [4, [fiscalYear, 7, 1]],
  ]);
  const endMap = new Map<number, [number, number, number]>([
    [1, [calYearForQ1, 12, 31]],
    [2, [fiscalYear, 3, 31]],
    [3, [fiscalYear, 6, 30]],
    [4, [fiscalYear, 9, 30]],
  ]);
  const [sy, sm, sd] = startMap.get(quarter)!;
  const [ey, em, ed] = endMap.get(quarter)!;
  const monthsMap = new Map<number, string>([
    [1, `Oct-Dec ${calYearForQ1}`],
    [2, `Jan-Mar ${fiscalYear}`],
    [3, `Apr-Jun ${fiscalYear}`],
    [4, `Jul-Sep ${fiscalYear}`],
  ]);
  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return {
    fyLabel: `FY${fiscalYear} Q${quarter}`,
    monthsLabel: monthsMap.get(quarter) ?? '',
    periodStart: iso(sy, sm, sd),
    periodEnd: iso(ey, em, ed),
  };
}

/**
 * Given an `as_of_quarter` value like "FY2026Q2" (USCIS fiscal-quarter), return the
 * user-facing calendar-year quarter label. E.g.:
 *   FY2026Q1 (Oct–Dec 2025) → "Q4 2025"
 *   FY2026Q2 (Jan–Mar 2026) → "Q1 2026"
 *   FY2026Q3 (Apr–Jun 2026) → "Q2 2026"
 *   FY2026Q4 (Jul–Sep 2026) → "Q3 2026"
 */
export function calendarQuarterLabelForAsOf(asOfQuarter: string): string {
  const q = quarterLabelForAsOf(asOfQuarter);
  const parsed = parseAsOfQuarter(asOfQuarter);
  if (!parsed) return q.fyLabel;
  const fiscalYear = parsed.fiscalYear;
  const quarter = parsed.quarter;
  if (quarter === 1) return `Q4 ${fiscalYear - 1}`;
  return `Q${quarter - 1} ${fiscalYear}`;
}

export function fiscalYearForReceiptMonth(receiptYear: number, receiptMonth: number): number {
  return receiptMonth >= 10 ? receiptYear + 1 : receiptYear;
}

export function receiptQuarterOfMonth(month: number): 1 | 2 | 3 | 4 {
  if (month >= 10 && month <= 12) return 1;
  if (month >= 1 && month <= 3) return 2;
  if (month >= 4 && month <= 6) return 3;
  return 4;
}

/** Calendar quarter (not USCIS fiscal quarter). Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec. */
export function calendarQuarterOfMonth(month: number): 1 | 2 | 3 | 4 {
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function monthShort(m: number): string {
  return MONTH_NAMES_SHORT[m - 1] ?? `M${m}`;
}

// ---------------------------------------------------------------------------
// Filings time-series aggregation (Trend tab main chart, X = time)
// ---------------------------------------------------------------------------

export type FilingGrain = 'month' | 'quarter' | 'fiscal_year';
export type FilingSplit = 'none' | 'form_type' | 'tea' | 'country';

export interface TimeBucketMeta {
  key: string;
  label: string;
  shortLabel: string;
  sortKey: string;
}

export interface FilingTimeSeriesPoint {
  meta: TimeBucketMeta;
  bucket: AggregatedBucket;
}

export function filingTimeBucket(
  cell: Pick<I526FilingCell, 'receipt_year' | 'receipt_month' | 'receipt_quarter'>,
  grain: FilingGrain,
): TimeBucketMeta | null {
  if (cell.receipt_year == null) return null;
  const y = cell.receipt_year;
  if (grain === 'month') {
    if (cell.receipt_month == null) return null;
    const m = cell.receipt_month;
    const yy = String(y).slice(-2);
    const mn = monthShort(m);
    return {
      key: `${y}-${String(m).padStart(2, '0')}`,
      sortKey: `${y}-${String(m).padStart(2, '0')}`,
      label: `${mn} ${yy}`,
      shortLabel: m === 1 || m === 10 ? `${mn} ${yy}` : mn,
    };
  }
  if (grain === 'quarter') {
    const m = cell.receipt_month ?? 1;
    const q = calendarQuarterOfMonth(m);
    const y = cell.receipt_year;
    return {
      key: `${y}-q${q}`,
      sortKey: `${y}-q${q}`,
      label: `Q${q} ${y}`,
      shortLabel: q === 1 ? String(y) : `Q${q}`,
    };
  }
  // fiscal_year
  const fy = fiscalYearForReceiptMonth(y, cell.receipt_month ?? 1);
  return {
    key: `FY${fy}`,
    sortKey: `FY${fy}`,
    label: `FY${fy}`,
    shortLabel: `FY${String(fy).slice(2)}`,
  };
}

export function aggregateFilingTimeSeries(
  cells: I526FilingCell[],
  grain: FilingGrain,
): FilingTimeSeriesPoint[] {
  const map = new Map<string, FilingTimeSeriesPoint>();
  for (const c of cells) {
    const meta = filingTimeBucket(c, grain);
    if (!meta) continue;
    const entry = map.get(meta.key) ?? { meta, bucket: { count: 0, suppressedCells: 0 } };
    if (c.suppressed) entry.bucket.suppressedCells += 1;
    else entry.bucket.count += c.count ?? 0;
    map.set(meta.key, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.meta.sortKey.localeCompare(b.meta.sortKey));
}

export interface SplitSeriesPoint {
  key: string;
  value: number;
  suppressedCells: number;
}

export interface SplitSeries {
  key: string;
  label: string;
  points: SplitSeriesPoint[];
}

export interface SplitTimeResult {
  xAxis: TimeBucketMeta[];
  series: SplitSeries[];
}

function filingSplitKey(cell: I526FilingCell, split: FilingSplit): string | null {
  if (split === 'none') return null;
  if (split === 'form_type') return cell.form_type;
  if (split === 'tea') return cell.tea_category;
  return cell.country;
}

export function filingSplitLabel(key: string, split: FilingSplit): string {
  if (split === 'form_type') {
    return (FILING_FORM_LABELS as Record<string, string>)[key] ?? key;
  }
  if (split === 'tea') {
    return (TEA_LABELS as Record<string, string>)[key] ?? key;
  }
  return countryLabel(key);
}

export const STABLE_FORM_SPLIT_ORDER: string[] = ['I526', 'I526E', 'COMBINED'];
export const STABLE_TEA_SPLIT_ORDER: string[] = [
  'RURAL',
  'HIGH_UNEMPLOYMENT',
  'RURAL_AND_HIGH_UNEMPLOYMENT',
  'INFRASTRUCTURE',
  'UNRESERVED',
  'UNKNOWN_TEA',
  'DIRECT',
  'PRE_RIA_UNKNOWN',
  'OTHER',
];
export const STABLE_COUNTRY_SPLIT_ORDER: FilingCountry[] = [
  'china',
  'india',
  'vietnam',
  'korea_south',
  'taiwan',
  'rest_of_the_world',
];

export function stableSplitOrder(split: FilingSplit, keys: string[]): string[] {
  let order: readonly string[] = [];
  if (split === 'form_type') order = STABLE_FORM_SPLIT_ORDER;
  else if (split === 'tea') order = STABLE_TEA_SPLIT_ORDER;
  else if (split === 'country') order = STABLE_COUNTRY_SPLIT_ORDER;
  const set = new Set(keys);
  const out: string[] = [];
  for (const k of order) if (set.has(k)) out.push(k);
  for (const k of keys) if (!order.includes(k)) out.push(k);
  return out;
}

export function aggregateSplitFilingTimeSeries(
  cells: I526FilingCell[],
  grain: FilingGrain,
  split: FilingSplit,
  seriesKeysIn?: string[],
): SplitTimeResult {
  const xMap = new Map<string, TimeBucketMeta>();
  const seriesKeys = new Set(seriesKeysIn ?? []);
  const counts = new Map<string, Map<string, AggregatedBucket>>();

  if (split === 'none') {
    const single = aggregateFilingTimeSeries(cells, grain);
    return {
      xAxis: single.map((s) => s.meta),
      series: single.length
        ? [
            {
              key: 'total',
              label: 'Total filings',
              points: single.map((s) => ({
                key: s.meta.key,
                value: s.bucket.count,
                suppressedCells: s.bucket.suppressedCells,
              })),
            },
          ]
        : [],
    };
  }

  for (const c of cells) {
    const meta = filingTimeBucket(c, grain);
    if (!meta) continue;
    const sk = filingSplitKey(c, split);
    if (!sk) continue;
    xMap.set(meta.key, meta);
    seriesKeys.add(sk);
    const byX = counts.get(sk) ?? new Map<string, AggregatedBucket>();
    const bucket = byX.get(meta.key) ?? { count: 0, suppressedCells: 0 };
    if (c.suppressed) bucket.suppressedCells += 1;
    else bucket.count += c.count ?? 0;
    byX.set(meta.key, bucket);
    counts.set(sk, byX);
  }

  const xAxis = Array.from(xMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const orderedKeys = stableSplitOrder(split, Array.from(seriesKeys));

  const series: SplitSeries[] = orderedKeys.map((sk) => {
    const byX = counts.get(sk) ?? new Map();
    return {
      key: sk,
      label: filingSplitLabel(sk, split),
      points: xAxis.map((meta) => {
        const bucket = byX.get(meta.key) ?? { count: 0, suppressedCells: 0 };
        return {
          key: meta.key,
          value: bucket.count,
          suppressedCells: bucket.suppressedCells,
        };
      }),
    };
  });

  return { xAxis, series };
}

// ---------------------------------------------------------------------------
// Rural : HUA application ratio
// ---------------------------------------------------------------------------

/** TEA categories that feed the Rural : HUA ratio (fetch filter). */
export const RATIO_TEAS = [
  'RURAL',
  'HIGH_UNEMPLOYMENT',
  'RURAL_AND_HIGH_UNEMPLOYMENT',
] as const;

/** How to allocate the dual-qualifying "Rural & HUA" bucket in the ratio. */
export type RatioBothMode = 'exclude' | 'rural' | 'split';
export type RatioSplit = 'none' | 'form_type' | 'country';

export interface I526RatioFacet {
  key: string;
  label: string;
  /** Per-period ratio (rural / hua); null where hua is 0 for that period. */
  monthly: (number | null)[];
  /** Cumulative ratio (running rural / running hua); null until hua > 0. */
  cumulative: (number | null)[];
}

export interface I526RatioData {
  xAxis: TimeBucketMeta[];
  facets: I526RatioFacet[];
}

/**
 * Rural : High-unemployment application ratio over time. Rural set-aside visas
 * are twice HUA (20% vs 10%), so a ratio of 2 means demand is balanced to
 * supply. `bothMode` controls how the dual-qualifying "Rural & HUA" bucket is
 * allocated: excluded (default), counted as rural, or split evenly.
 */
export function computeI526RatioData(
  cells: I526FilingCell[],
  grain: FilingGrain,
  split: RatioSplit,
  bothMode: RatioBothMode,
): I526RatioData {
  const xMap = new Map<string, TimeBucketMeta>();
  const facetMap = new Map<
    string,
    Map<string, { rural: number; hua: number; both: number }>
  >();

  const facetKeyOf = (c: I526FilingCell): string =>
    split === 'none' ? 'all' : split === 'form_type' ? c.form_type : c.country;

  for (const c of cells) {
    if (c.suppressed) continue;
    const meta = filingTimeBucket(c, grain);
    if (!meta) continue;
    xMap.set(meta.key, meta);
    const fk = facetKeyOf(c);
    const byX =
      facetMap.get(fk) ??
      new Map<string, { rural: number; hua: number; both: number }>();
    const agg = byX.get(meta.key) ?? { rural: 0, hua: 0, both: 0 };
    const n = c.count ?? 0;
    if (c.tea_category === 'RURAL') agg.rural += n;
    else if (c.tea_category === 'HIGH_UNEMPLOYMENT') agg.hua += n;
    else if (c.tea_category === 'RURAL_AND_HIGH_UNEMPLOYMENT') agg.both += n;
    byX.set(meta.key, agg);
    facetMap.set(fk, byX);
  }

  const xAxis = Array.from(xMap.values()).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey),
  );

  const allocate = (agg: { rural: number; hua: number; both: number }) => {
    if (bothMode === 'rural') return { rural: agg.rural + agg.both, hua: agg.hua };
    if (bothMode === 'split')
      return { rural: agg.rural + agg.both / 2, hua: agg.hua + agg.both / 2 };
    return { rural: agg.rural, hua: agg.hua };
  };

  const facetKeys =
    split === 'none'
      ? ['all']
      : stableSplitOrder(split as FilingSplit, Array.from(facetMap.keys()));

  const facets: I526RatioFacet[] = facetKeys.map((fk) => {
    const byX =
      facetMap.get(fk) ??
      new Map<string, { rural: number; hua: number; both: number }>();
    const monthly: (number | null)[] = [];
    const cumulative: (number | null)[] = [];
    let cumR = 0;
    let cumH = 0;
    for (const x of xAxis) {
      const raw = byX.get(x.key) ?? { rural: 0, hua: 0, both: 0 };
      const { rural, hua } = allocate(raw);
      cumR += rural;
      cumH += hua;
      monthly.push(hua > 0 ? rural / hua : null);
      cumulative.push(cumH > 0 ? cumR / cumH : null);
    }
    return {
      key: fk,
      label: split === 'none' ? 'All' : filingSplitLabel(fk, split as FilingSplit),
      monthly,
      cumulative,
    };
  });

  return { xAxis, facets };
}

// Breakdown across all cells (trend section 3 & compare tab): split by TEA/country/form
export function aggregateBreakdown(
  cells: I526FilingCell[],
  split: Exclude<FilingSplit, 'none'>,
): Array<{ key: string; label: string; bucket: AggregatedBucket }> {
  const by = aggregateFilingBucketsBy(cells, (c) => filingSplitKey(c, split) ?? '__none');
  const rows: Array<{ key: string; label: string; bucket: AggregatedBucket }> = [];
  for (const [k, bucket] of by.entries()) {
    if (k === '__none') continue;
    if (bucket.count === 0 && bucket.suppressedCells === 0) continue;
    rows.push({ key: k, label: filingSplitLabel(k, split), bucket });
  }
  const orderedKeys = stableSplitOrder(split, rows.map((r) => r.key));
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const out: typeof rows = [];
  for (const k of orderedKeys) {
    const r = byKey.get(k);
    if (r) out.push(r);
  }
  for (const r of rows) if (!orderedKeys.includes(r.key)) out.push(r);
  out.sort((a, b) => b.bucket.count - a.bucket.count || a.label.localeCompare(b.label));
  return out;
}

// ---------------------------------------------------------------------------
// Compare tab helpers (filings)
// ---------------------------------------------------------------------------

export function compareBreakdown(
  earlierCells: I526FilingCell[],
  laterCells: I526FilingCell[],
  split: Exclude<FilingSplit, 'none'>,
): Array<{ key: string; label: string; earlier: AggregatedBucket; later: AggregatedBucket }> {
  const e = new Map(aggregateBreakdown(earlierCells, split).map((r) => [r.key, r]));
  const l = new Map(aggregateBreakdown(laterCells, split).map((r) => [r.key, r]));
  const allKeys = new Set([...e.keys(), ...l.keys()]);
  const ordered = stableSplitOrder(split, Array.from(allKeys));
  return ordered
    .map((k) => {
      const er = e.get(k)?.bucket ?? { count: 0, suppressedCells: 0 };
      const lr = l.get(k)?.bucket ?? { count: 0, suppressedCells: 0 };
      const hasData = Boolean(
        er.count || er.suppressedCells || lr.count || lr.suppressedCells,
      );
      const lbl =
        e.get(k)?.label ?? l.get(k)?.label ?? filingSplitLabel(k, split);
      return { key: k, label: lbl, earlier: er, later: lr, hasData };
    })
    .filter((r) => r.hasData)
    .map(({ key, label, earlier, later }) => ({ key, label, earlier, later }));
}

// ---------------------------------------------------------------------------
// Compare tab helpers (processing)
// ---------------------------------------------------------------------------

export type ProcessingMetricKey =
  | 'q_receipts'
  | 'q_approvals'
  | 'q_denials'
  | 'q_completions'
  | 'pending'
  | 'median_processing_months';

export const PROCESSING_METRIC_LABELS: Record<ProcessingMetricKey, string> = {
  q_receipts: 'Receipts',
  q_approvals: 'Approvals',
  q_denials: 'Denials',
  q_completions: 'Completions',
  pending: 'Pending (end of quarter)',
  median_processing_months: 'Median months',
};

export function processingRowForForm(
  rows: I526ProcessingRow[],
  form: ProcessingFormType,
): I526ProcessingRow | undefined {
  return rows.find((r) => r.form_type === form);
}

export function sumMetricAcrossForms(
  rows: I526ProcessingRow[],
  forms: ProcessingFormType[],
  metric: ProcessingMetricKey,
): number | null {
  let sum: number | null = null;
  let anySuppressed = false;
  for (const r of rows) {
    if (!forms.includes(r.form_type)) continue;
    if (r.suppressed_q) anySuppressed = true;
    const v = r[metric] as number | null;
    if (v != null) sum = (sum ?? 0) + v;
  }
  if (anySuppressed && sum == null) return null;
  return sum;
}
