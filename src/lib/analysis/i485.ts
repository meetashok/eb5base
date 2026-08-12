import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase-env';

function clientOrBrowser(client?: SupabaseClient) {
  return client ?? createClient();
}

/** One USCIS snapshot (report release). */
export interface I485Release {
  id: number;
  as_of_date: string;
  published_date: string | null;
  source_url: string;
  source_title: string;
}

/** One non-zero cell of the report matrix. Missing cells mean zero. */
export interface I485Cell {
  release_id: number;
  country: I485Country;
  category: I485Category;
  visa_status: 'available' | 'awaiting';
  /** 0 encodes the "Prior Years" rollup bucket. */
  pd_year: number;
  pd_month: number;
  /** null when USCIS suppressed the value (D = under 10). */
  count: number | null;
  suppressed: boolean;
}

export type I485Country =
  | 'rest_of_world'
  | 'china'
  | 'india'
  | 'mexico'
  | 'philippines';

export type I485Category =
  | 'EB1'
  | 'EB2'
  | 'EB3'
  | 'EW3'
  | 'EB4'
  | 'CRW'
  | 'EB5_UNRESERVED'
  | 'EB5_SET_ASIDE'
  | 'EB5_RURAL'
  | 'EB5_HIGH_UNEMPLOYMENT'
  | 'EB5_INFRASTRUCTURE';

export const COUNTRY_OPTIONS: { value: I485Country | 'all'; label: string }[] = [
  { value: 'all', label: 'All countries' },
  { value: 'india', label: 'India' },
  { value: 'china', label: 'China' },
  { value: 'mexico', label: 'Mexico' },
  { value: 'philippines', label: 'Philippines' },
  { value: 'rest_of_world', label: 'Rest of the World' },
];

/**
 * Category filter options. "EB5_ALL" sums every EB-5 sub-bucket
 * (unreserved + set-asides, including the short-lived 2024 lump bucket).
 * "EB5_SET_ASIDES" is the reserved/set-aside group only (RIA rural,
 * high-unemployment, and infrastructure, plus the early-2024 lump).
 */
export const CATEGORY_OPTIONS: { value: string; label: string; members: I485Category[] }[] = [
  { value: 'EB5_ALL', label: 'EB-5 (all)', members: ['EB5_UNRESERVED', 'EB5_SET_ASIDE', 'EB5_RURAL', 'EB5_HIGH_UNEMPLOYMENT', 'EB5_INFRASTRUCTURE'] },
  { value: 'EB5_UNRESERVED', label: 'EB-5 Unreserved', members: ['EB5_UNRESERVED'] },
  { value: 'EB5_SET_ASIDES', label: 'EB-5 set-asides (all)', members: ['EB5_SET_ASIDE', 'EB5_RURAL', 'EB5_HIGH_UNEMPLOYMENT', 'EB5_INFRASTRUCTURE'] },
  { value: 'EB5_RURAL', label: 'EB-5 Rural set-aside', members: ['EB5_RURAL'] },
  { value: 'EB5_HIGH_UNEMPLOYMENT', label: 'EB-5 High-unemployment set-aside', members: ['EB5_HIGH_UNEMPLOYMENT'] },
  { value: 'EB5_INFRASTRUCTURE', label: 'EB-5 Infrastructure set-aside', members: ['EB5_INFRASTRUCTURE'] },
  { value: 'EB1', label: 'EB-1', members: ['EB1'] },
  { value: 'EB2', label: 'EB-2', members: ['EB2'] },
  { value: 'EB3', label: 'EB-3', members: ['EB3'] },
  { value: 'EW3', label: 'EB-3 Other Workers', members: ['EW3'] },
  { value: 'EB4', label: 'EB-4', members: ['EB4'] },
  { value: 'CRW', label: 'EB-4 Religious Workers', members: ['CRW'] },
];

/** Default explorer category filter (Set-asides). */
export const DEFAULT_I485_CATEGORY = 'EB5_SET_ASIDES';
export const DEFAULT_I485_CATEGORIES: string[] = [DEFAULT_I485_CATEGORY];

/** Individual set-aside chips that are covered by the Set-asides group filter. */
export const SET_ASIDE_DETAIL_FILTERS = [
  'EB5_RURAL',
  'EB5_HIGH_UNEMPLOYMENT',
  'EB5_INFRASTRUCTURE',
] as const;

export function categoryMembersFor(value: string): I485Category[] {
  return CATEGORY_OPTIONS.find((o) => o.value === value)?.members ?? [];
}

/** Union member categories for a multi-select filter list. */
export function categoryMembersForMany(values: string[]): I485Category[] {
  const set = new Set<I485Category>();
  for (const value of values) {
    for (const member of categoryMembersFor(value)) set.add(member);
  }
  return Array.from(set);
}

/** Compact button labels for the explorer category picker. */
export const EB5_CATEGORY_BUTTONS: { value: string; label: string }[] = [
  { value: 'EB5_ALL', label: 'EB-5 (all)' },
  { value: 'EB5_UNRESERVED', label: 'Unreserved' },
  { value: 'EB5_SET_ASIDES', label: 'Set-asides' },
  { value: 'EB5_RURAL', label: 'Rural' },
  { value: 'EB5_HIGH_UNEMPLOYMENT', label: 'High unemp.' },
  { value: 'EB5_INFRASTRUCTURE', label: 'Infrastructure' },
];

export const OTHER_CATEGORY_BUTTONS: { value: string; label: string }[] = [
  { value: 'EB1', label: 'EB-1' },
  { value: 'EB2', label: 'EB-2' },
  { value: 'EB3', label: 'EB-3' },
  { value: 'EW3', label: 'Other Workers' },
  { value: 'EB4', label: 'EB-4' },
  { value: 'CRW', label: 'Religious Workers' },
];

export function isEb5CategoryFilter(value: string): boolean {
  return value.startsWith('EB5_');
}

function isSetAsideDetail(value: string): boolean {
  return (SET_ASIDE_DETAIL_FILTERS as readonly string[]).includes(value);
}

/**
 * Toggle a category chip with exclusivity rules:
 * - EB-5 filters and non-EB5 filters cannot mix.
 * - EB-5 (all) is exclusive within EB-5 (only that filter).
 * - Set-asides cannot combine with Rural / High unemp. / Infrastructure.
 * - Selection never collapses to empty (falls back to default EB-5 or EB-1).
 */
export function toggleCategoryFilter(current: string[], next: string): string[] {
  const selectingNonEb5 = !isEb5CategoryFilter(next);

  if (selectingNonEb5) {
    const nonEb5 = current.filter((v) => !isEb5CategoryFilter(v));
    if (nonEb5.includes(next)) {
      const without = nonEb5.filter((v) => v !== next);
      return without.length > 0 ? without : [OTHER_CATEGORY_BUTTONS[0]!.value];
    }
    return [...nonEb5, next];
  }

  // Selecting any EB-5 chip drops all non-EB5 filters.
  const eb5Only = current.filter((v) => isEb5CategoryFilter(v));

  if (next === 'EB5_ALL') {
    return eb5Only.length === 1 && eb5Only[0] === 'EB5_ALL'
      ? [...DEFAULT_I485_CATEGORIES]
      : ['EB5_ALL'];
  }

  let base = eb5Only.filter((v) => v !== 'EB5_ALL');

  if (next === 'EB5_SET_ASIDES') {
    if (base.includes(next)) {
      const without = base.filter((v) => v !== next);
      return without.length > 0 ? without : [...DEFAULT_I485_CATEGORIES];
    }
    return [...base.filter((v) => !isSetAsideDetail(v)), 'EB5_SET_ASIDES'];
  }

  if (isSetAsideDetail(next)) {
    if (base.includes(next)) {
      const without = base.filter((v) => v !== next);
      return without.length > 0 ? without : [...DEFAULT_I485_CATEGORIES];
    }
    return [...base.filter((v) => v !== 'EB5_SET_ASIDES'), next];
  }

  if (base.includes(next)) {
    const without = base.filter((v) => v !== next);
    return without.length > 0 ? without : [...DEFAULT_I485_CATEGORIES];
  }

  return [...base, next];
}

/** Enter non-EB5 mode (clears EB-5). Defaults to EB-1 when empty. */
export function enterNonEb5Categories(current: string[]): string[] {
  const nonEb5 = current.filter((v) => !isEb5CategoryFilter(v));
  return nonEb5.length > 0 ? nonEb5 : [OTHER_CATEGORY_BUTTONS[0]!.value];
}

export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function countryLabel(value: I485Country): string {
  return COUNTRY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function isI485DataAvailable(): boolean {
  return isSupabaseConfigured();
}

export async function fetchI485Releases(client?: SupabaseClient): Promise<I485Release[]> {
  const supabase = clientOrBrowser(client);
  const { data, error } = await supabase
    .from('i485_releases')
    .select('id, as_of_date, published_date, source_url, source_title')
    .order('as_of_date', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface CellFilters {
  releaseId?: number;
  country?: I485Country;
  /** Multi-country filter; preferred over `country` when both are set. */
  countries?: I485Country[];
  categories?: I485Category[];
  pdYear?: number;
  pdMonth?: number;
  /** Inclusive priority-date year lower bound (for cohort ranges). */
  pdYearGte?: number;
  /** Inclusive priority-date year upper bound (for cohort ranges). */
  pdYearLte?: number;
}

const PAGE = 1000;

/** Fetch matching cells, paging past PostgREST's 1000-row limit. */
export async function fetchI485Cells(
  filters: CellFilters,
  client?: SupabaseClient,
): Promise<I485Cell[]> {
  const supabase = clientOrBrowser(client);
  const out: I485Cell[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from('i485_inventory_cells')
      .select('release_id, country, category, visa_status, pd_year, pd_month, count, suppressed')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (filters.releaseId != null) q = q.eq('release_id', filters.releaseId);
    if (filters.countries && filters.countries.length > 0) {
      q = q.in('country', filters.countries);
    } else if (filters.country) {
      q = q.eq('country', filters.country);
    }
    if (filters.categories && filters.categories.length > 0) q = q.in('category', filters.categories);
    if (filters.pdYear != null) q = q.eq('pd_year', filters.pdYear);
    if (filters.pdMonth != null) q = q.eq('pd_month', filters.pdMonth);
    if (filters.pdYearGte != null) q = q.gte('pd_year', filters.pdYearGte);
    if (filters.pdYearLte != null) q = q.lte('pd_year', filters.pdYearLte);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as I485Cell[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export interface AggregatedBucket {
  /** Disclosed count total (suppressed cells excluded). */
  count: number;
  /** Number of suppressed cells (each represents 1-9 applications). */
  suppressedCells: number;
}

export function aggregateBy<K extends string | number>(
  cells: I485Cell[],
  keyFn: (c: I485Cell) => K,
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

/** Grain for snapshot time-axis charts. */
export type PriorityDateGrain = 'month' | 'quarter' | 'year';

/**
 * Federal / USCIS fiscal year: Oct 1 – Sep 30.
 * October–December of calendar year Y belong to FY Y+1.
 * Used only by the Fiscal years grain.
 */
export function fiscalYear(calendarYear: number, month: number): number {
  return month >= 10 ? calendarYear + 1 : calendarYear;
}

/** Calendar quarter: Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec. */
export function calendarQuarter(month: number): 1 | 2 | 3 | 4 {
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

export interface TimeBucketMeta {
  /** Sortable key (Earlier sorts first via leading underscore). */
  key: string;
  /** Full label for tooltips / axis hover. */
  label: string;
  /** Compact axis tick. */
  shortLabel: string;
}

/** Map a cell onto a time-axis bucket for the chosen grain. */
export function priorityDateBucket(
  cell: Pick<I485Cell, 'pd_year' | 'pd_month'>,
  grain: PriorityDateGrain,
): TimeBucketMeta {
  if (cell.pd_year === 0) {
    return { key: '_earlier', label: 'Earlier (prior years)', shortLabel: 'Prior' };
  }

  const y = cell.pd_year;
  const m = cell.pd_month;

  if (grain === 'month') {
    const monthName = MONTH_LABELS[m - 1] ?? String(m);
    return {
      key: `${y}-${String(m).padStart(2, '0')}`,
      label: `${monthName} ${y}`,
      shortLabel: m === 1 ? String(y) : MONTH_LABELS[m - 1]?.slice(0, 1) ?? '',
    };
  }

  if (grain === 'quarter') {
    const q = calendarQuarter(m);
    return {
      key: `${y}-q${q}`,
      label: `Q${q} ${y}`,
      shortLabel: q === 1 ? String(y) : `Q${q}`,
    };
  }

  const fy = fiscalYear(y, m);
  return {
    key: `fy${fy}`,
    label: `FY${fy}`,
    shortLabel: `FY${String(fy).slice(2)}`,
  };
}

/** Aggregate cells onto a sorted time series for the snapshot chart. */
export function aggregateByPriorityDateGrain(
  cells: I485Cell[],
  grain: PriorityDateGrain,
): { meta: TimeBucketMeta; bucket: AggregatedBucket }[] {
  const map = new Map<string, { meta: TimeBucketMeta; bucket: AggregatedBucket }>();
  for (const c of cells) {
    const meta = priorityDateBucket(c, grain);
    const entry = map.get(meta.key) ?? { meta, bucket: { count: 0, suppressedCells: 0 } };
    if (c.suppressed) entry.bucket.suppressedCells += 1;
    else entry.bucket.count += c.count ?? 0;
    map.set(meta.key, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.meta.key.localeCompare(b.meta.key));
}

export type SnapshotSplit = 'none' | 'country' | 'category';

export const SNAPSHOT_SPLIT_OPTIONS: { value: SnapshotSplit; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'country', label: 'By country' },
  { value: 'category', label: 'By category' },
];

/** Short labels for EB / EB-5 member categories on split charts. */
export const CATEGORY_MEMBER_LABELS: Record<I485Category, string> = {
  EB1: 'EB-1',
  EB2: 'EB-2',
  EB3: 'EB-3',
  EW3: 'Other Workers',
  EB4: 'EB-4',
  CRW: 'Religious Workers',
  EB5_UNRESERVED: 'Unreserved',
  EB5_SET_ASIDE: 'Other',
  EB5_RURAL: 'Rural',
  EB5_HIGH_UNEMPLOYMENT: 'High unemp.',
  EB5_INFRASTRUCTURE: 'Infrastructure',
};

/** Member categories that roll up into the Set-asides filter. */
export const SET_ASIDE_MEMBER_CATEGORIES: I485Category[] = [
  'EB5_RURAL',
  'EB5_HIGH_UNEMPLOYMENT',
  'EB5_INFRASTRUCTURE',
  'EB5_SET_ASIDE',
];

/** Stable order for category-split series keys (members + virtual lumps). */
export const CATEGORY_SPLIT_ORDER: string[] = [
  'EB5_UNRESERVED',
  'EB5_SET_ASIDES',
  'EB5_RURAL',
  'EB5_HIGH_UNEMPLOYMENT',
  'EB5_INFRASTRUCTURE',
  'EB5_SET_ASIDE',
  'EB1',
  'EB2',
  'EB3',
  'EW3',
  'EB4',
  'CRW',
];

function isSetAsideMemberCategory(category: string): boolean {
  return (SET_ASIDE_MEMBER_CATEGORIES as readonly string[]).includes(category);
}

/**
 * How to split the snapshot chart by category, given the active filter chips.
 *
 * - EB-5 (all), or Unreserved + Set-asides: two lines — Unreserved vs Set-asides lump
 * - Set-asides alone (or individual set-aside chips): one line per set-aside member
 * - Other filters: one line per selected member category
 */
export function resolveCategorySplitSeries(filters: string[]): {
  seriesKeys: string[];
  seriesKeyForCell: (cell: I485Cell) => string | null;
  seriesLabel: (key: string) => string;
} {
  const lumpUnreservedVsSetAsides =
    filters.includes('EB5_ALL') ||
    (filters.includes('EB5_UNRESERVED') && filters.includes('EB5_SET_ASIDES'));

  if (lumpUnreservedVsSetAsides) {
    return {
      seriesKeys: ['EB5_UNRESERVED', 'EB5_SET_ASIDES'],
      seriesKeyForCell: (cell) => {
        if (cell.category === 'EB5_UNRESERVED') return 'EB5_UNRESERVED';
        if (isSetAsideMemberCategory(cell.category)) return 'EB5_SET_ASIDES';
        return null;
      },
      seriesLabel: (key) => {
        if (key === 'EB5_SET_ASIDES') return 'Set-asides';
        return CATEGORY_MEMBER_LABELS[key as I485Category] ?? key;
      },
    };
  }

  const members = categoryMembersForMany(filters);
  const memberSet = new Set<string>(members);
  const seriesKeys = CATEGORY_SPLIT_ORDER.filter(
    (key) => key !== 'EB5_SET_ASIDES' && memberSet.has(key),
  );

  return {
    seriesKeys,
    seriesKeyForCell: (cell) => (memberSet.has(cell.category) ? cell.category : null),
    seriesLabel: (key) => CATEGORY_MEMBER_LABELS[key as I485Category] ?? key,
  };
}

/** Stable country order for split series (excludes the All sentinel). */
export const SPLIT_COUNTRY_ORDER: I485Country[] = [
  'india',
  'china',
  'mexico',
  'philippines',
  'rest_of_world',
];

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

export interface SplitPriorityDateResult {
  xAxis: TimeBucketMeta[];
  series: SplitSeries[];
}

/**
 * Multi-series aggregation for snapshot split charts.
 * X-axis is priority-date grain; each series is a country or category member.
 * Missing buckets are filled with 0 so lines share a common domain.
 */
export function aggregateSplitByPriorityDateGrain(
  cells: I485Cell[],
  grain: PriorityDateGrain,
  seriesKeys: string[],
  seriesKeyFn: (cell: I485Cell) => string | null,
  seriesLabelFn: (key: string) => string,
): SplitPriorityDateResult {
  const xMap = new Map<string, TimeBucketMeta>();
  const counts = new Map<string, Map<string, AggregatedBucket>>();

  for (const key of seriesKeys) {
    counts.set(key, new Map());
  }

  for (const cell of cells) {
    const seriesKey = seriesKeyFn(cell);
    if (seriesKey == null || !counts.has(seriesKey)) continue;
    const meta = priorityDateBucket(cell, grain);
    xMap.set(meta.key, meta);
    const byX = counts.get(seriesKey)!;
    const bucket = byX.get(meta.key) ?? { count: 0, suppressedCells: 0 };
    if (cell.suppressed) bucket.suppressedCells += 1;
    else bucket.count += cell.count ?? 0;
    byX.set(meta.key, bucket);
  }

  const xAxis = Array.from(xMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  const series: SplitSeries[] = seriesKeys.map((key) => {
    const byX = counts.get(key)!;
    return {
      key,
      label: seriesLabelFn(key),
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

/** Countries to plot when splitting: selection, or all five when All. */
export function splitCountriesForFilter(selected: I485Country[]): I485Country[] {
  if (selected.length === 0) return [...SPLIT_COUNTRY_ORDER];
  return SPLIT_COUNTRY_ORDER.filter((c) => selected.includes(c));
}

export type CohortSplit = 'none' | 'priority_date';

export const COHORT_SPLIT_OPTIONS: { value: CohortSplit; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'priority_date', label: 'By priority date' },
];

export interface PriorityDateRange {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
}

export function yearMonthIndex(year: number, month: number): number {
  return year * 12 + month;
}

export function cellInPriorityDateRange(
  cell: Pick<I485Cell, 'pd_year' | 'pd_month'>,
  range: PriorityDateRange,
): boolean {
  if (cell.pd_year === 0) return false;
  const v = yearMonthIndex(cell.pd_year, cell.pd_month);
  return (
    v >= yearMonthIndex(range.fromYear, range.fromMonth) &&
    v <= yearMonthIndex(range.toYear, range.toMonth)
  );
}

export function normalizePriorityDateRange(range: PriorityDateRange): PriorityDateRange {
  const from = yearMonthIndex(range.fromYear, range.fromMonth);
  const to = yearMonthIndex(range.toYear, range.toMonth);
  if (from <= to) return range;
  return {
    fromYear: range.toYear,
    fromMonth: range.toMonth,
    toYear: range.fromYear,
    toMonth: range.fromMonth,
  };
}

export function formatPriorityDateRange(range: PriorityDateRange): string {
  const r = normalizePriorityDateRange(range);
  const fromLabel = `${MONTH_LABELS[r.fromMonth - 1] ?? r.fromMonth} ${r.fromYear}`;
  const toLabel = `${MONTH_LABELS[r.toMonth - 1] ?? r.toMonth} ${r.toYear}`;
  if (fromLabel === toLabel) return fromLabel;
  return `${fromLabel} – ${toLabel}`;
}

/** Bucket a USCIS as-of date for cohort X-axis grouping. */
export function asOfDateBucket(asOfIso: string, grain: PriorityDateGrain): TimeBucketMeta {
  const d = new Date(`${asOfIso}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return priorityDateBucket({ pd_year: y, pd_month: m }, grain);
}

/**
 * Group releases onto a snapshot grain; each bucket keeps the latest release.
 */
export function latestReleasesByGrain(
  releases: I485Release[],
  grain: PriorityDateGrain,
): { meta: TimeBucketMeta; release: I485Release }[] {
  const byKey = new Map<string, { meta: TimeBucketMeta; release: I485Release }>();
  for (const release of releases) {
    const meta = asOfDateBucket(release.as_of_date, grain);
    const existing = byKey.get(meta.key);
    if (!existing || release.as_of_date >= existing.release.as_of_date) {
      byKey.set(meta.key, { meta, release });
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.release.as_of_date.localeCompare(b.release.as_of_date),
  );
}

/** Enumerate priority-date series buckets covering an inclusive month range. */
export function priorityDateSeriesInRange(
  range: PriorityDateRange,
  grain: PriorityDateGrain,
): TimeBucketMeta[] {
  const r = normalizePriorityDateRange(range);
  const seen = new Map<string, TimeBucketMeta>();
  let y = r.fromYear;
  let m = r.fromMonth;
  while (yearMonthIndex(y, m) <= yearMonthIndex(r.toYear, r.toMonth)) {
    const meta = priorityDateBucket({ pd_year: y, pd_month: m }, grain);
    if (!seen.has(meta.key)) seen.set(meta.key, meta);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return Array.from(seen.values());
}

/**
 * Cohort totals across releases, optionally grouped by snapshot grain
 * (latest snapshot value in each quarter / fiscal year).
 */
export function aggregateCohortBySnapshotGrain(
  cells: I485Cell[],
  releases: I485Release[],
  snapshotGrain: PriorityDateGrain,
  range: PriorityDateRange,
): { meta: TimeBucketMeta; bucket: AggregatedBucket; releaseId: number }[] {
  const filtered = cells.filter((c) => cellInPriorityDateRange(c, range));
  const byRelease = aggregateBy(filtered, (c) => c.release_id);
  return latestReleasesByGrain(releases, snapshotGrain).map(({ meta, release }) => ({
    meta,
    releaseId: release.id,
    bucket: byRelease.get(release.id) ?? { count: 0, suppressedCells: 0 },
  }));
}

/**
 * Cohort multi-series: X = snapshot grain, series = priority-date grain buckets.
 */
export function aggregateCohortSplitByPriorityDate(
  cells: I485Cell[],
  releases: I485Release[],
  snapshotGrain: PriorityDateGrain,
  pdGrain: PriorityDateGrain,
  range: PriorityDateRange,
): SplitPriorityDateResult {
  const filtered = cells.filter((c) => cellInPriorityDateRange(c, range));
  const xPoints = latestReleasesByGrain(releases, snapshotGrain);
  const xAxis = xPoints.map((p) => p.meta);
  const seriesMetas = priorityDateSeriesInRange(range, pdGrain);

  const counts = new Map<string, Map<number, AggregatedBucket>>();
  for (const s of seriesMetas) counts.set(s.key, new Map());

  for (const cell of filtered) {
    const seriesMeta = priorityDateBucket(cell, pdGrain);
    const byRelease = counts.get(seriesMeta.key);
    if (!byRelease) continue;
    const bucket = byRelease.get(cell.release_id) ?? { count: 0, suppressedCells: 0 };
    if (cell.suppressed) bucket.suppressedCells += 1;
    else bucket.count += cell.count ?? 0;
    byRelease.set(cell.release_id, bucket);
  }

  // Keep series that have any disclosed count (avoid empty PD lines).
  const activeSeries = seriesMetas.filter((s) => {
    const byRelease = counts.get(s.key);
    if (!byRelease) return false;
    return Array.from(byRelease.values()).some((b) => b.count > 0 || b.suppressedCells > 0);
  });

  const series: SplitSeries[] = activeSeries.map((s) => {
    const byRelease = counts.get(s.key)!;
    return {
      key: s.key,
      label: s.label,
      points: xPoints.map(({ meta, release }) => {
        const bucket = byRelease.get(release.id) ?? { count: 0, suppressedCells: 0 };
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

export function formatAsOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatAsOfShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export const USCIS_DATA_PAGE_URL =
  'https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data';
