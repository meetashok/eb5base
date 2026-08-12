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
  /** Exact priority-date years to include (preferred for cohort multi-select). */
  pdYears?: number[];
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
    if (filters.pdYears && filters.pdYears.length > 0) {
      q = q.in('pd_year', filters.pdYears);
    } else {
      if (filters.pdYearGte != null) q = q.gte('pd_year', filters.pdYearGte);
      if (filters.pdYearLte != null) q = q.lte('pd_year', filters.pdYearLte);
    }
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
export type PriorityDateGrain = 'month' | 'quarter' | 'half' | 'year';

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

/** Calendar half: H1 Jan–Jun, H2 Jul–Dec. */
export function calendarHalf(month: number): 1 | 2 {
  return month <= 6 ? 1 : 2;
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
    const yy = String(y).slice(-2);
    return {
      key: `${y}-${String(m).padStart(2, '0')}`,
      label: `${monthName} ${yy}`,
      // January carries the year; other months stay as Jan/Feb/… for denser ticks.
      shortLabel: m === 1 ? `${monthName} ${yy}` : monthName,
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

  if (grain === 'half') {
    const h = calendarHalf(m);
    return {
      key: `${y}-h${h}`,
      label: `H${h} ${y}`,
      shortLabel: h === 1 ? String(y) : `H${h}`,
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

export type CohortSplit = 'none' | 'priority_date' | 'country' | 'category';

export const COHORT_SPLIT_OPTIONS: { value: CohortSplit; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'priority_date', label: 'By priority date' },
  { value: 'country', label: 'By country' },
  { value: 'category', label: 'By category' },
];

/** First calendar year shown as a recent multi-select chip. */
export const COHORT_RECENT_YEAR_START = 2023;
/** Oldest year offered in the Previous years range. */
export const COHORT_PREVIOUS_YEAR_MIN = 2005;

export interface PriorityDateYearSelection {
  /** Discrete recent calendar years (full years). */
  years: number[];
  /** Include an older contiguous year range via the Previous years controls. */
  previousEnabled: boolean;
  previousFromYear: number;
  previousToYear: number;
}

export const DEFAULT_PRIORITY_DATE_YEARS: PriorityDateYearSelection = {
  years: [2024, 2025],
  previousEnabled: false,
  previousFromYear: 2015,
  previousToYear: COHORT_RECENT_YEAR_START - 1,
};

export function recentCohortYearChips(latestYear: number): number[] {
  const end = Math.max(latestYear, COHORT_RECENT_YEAR_START);
  const years: number[] = [];
  for (let y = COHORT_RECENT_YEAR_START; y <= end; y += 1) years.push(y);
  return years;
}

export function normalizePriorityDateYearSelection(
  selection: PriorityDateYearSelection,
  latestYear = new Date().getUTCFullYear(),
): PriorityDateYearSelection {
  const recent = new Set(recentCohortYearChips(latestYear));
  const years = Array.from(new Set(selection.years.filter((y) => recent.has(y)))).sort(
    (a, b) => a - b,
  );
  const prevMax = COHORT_RECENT_YEAR_START - 1;
  let previousFromYear = Math.min(
    Math.max(selection.previousFromYear, COHORT_PREVIOUS_YEAR_MIN),
    prevMax,
  );
  let previousToYear = Math.min(
    Math.max(selection.previousToYear, COHORT_PREVIOUS_YEAR_MIN),
    prevMax,
  );
  if (previousFromYear > previousToYear) {
    const swap = previousFromYear;
    previousFromYear = previousToYear;
    previousToYear = swap;
  }

  const previousEnabled = selection.previousEnabled;
  if (years.length === 0 && !previousEnabled) {
    return {
      ...DEFAULT_PRIORITY_DATE_YEARS,
      years: DEFAULT_PRIORITY_DATE_YEARS.years.filter((y) => recent.has(y)),
      previousFromYear,
      previousToYear,
    };
  }

  return {
    years,
    previousEnabled,
    previousFromYear,
    previousToYear,
  };
}

/** Expand chip + previous-years selection into a sorted unique year list. */
export function yearsInPriorityDateSelection(
  selection: PriorityDateYearSelection,
  latestYear = new Date().getUTCFullYear(),
): number[] {
  const normalized = normalizePriorityDateYearSelection(selection, latestYear);
  const set = new Set(normalized.years);
  if (normalized.previousEnabled) {
    for (let y = normalized.previousFromYear; y <= normalized.previousToYear; y += 1) {
      set.add(y);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function cellInPriorityDateYears(
  cell: Pick<I485Cell, 'pd_year'>,
  years: number[],
): boolean {
  if (cell.pd_year === 0) return false;
  return years.includes(cell.pd_year);
}

export function formatPriorityDateYears(years: number[]): string {
  if (years.length === 0) return 'none';
  if (years.length === 1) return String(years[0]);

  const parts: string[] = [];
  let start = years[0]!;
  let prev = years[0]!;
  for (let i = 1; i < years.length; i += 1) {
    const y = years[i]!;
    if (y === prev + 1) {
      prev = y;
      continue;
    }
    parts.push(start === prev ? String(start) : `${start}–${prev}`);
    start = y;
    prev = y;
  }
  parts.push(start === prev ? String(start) : `${start}–${prev}`);
  return parts.join(', ');
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

/** Enumerate priority-date series buckets covering selected calendar years. */
export function priorityDateSeriesInYears(
  years: number[],
  grain: PriorityDateGrain,
): { meta: TimeBucketMeta; earliestAsOf: string | null }[] {
  const seen = new Map<string, { meta: TimeBucketMeta; earliestAsOf: string | null }>();
  for (const y of years) {
    for (let m = 1; m <= 12; m += 1) {
      const cell = { pd_year: y, pd_month: m };
      const meta = priorityDateBucket(cell, grain);
      if (!seen.has(meta.key)) {
        seen.set(meta.key, {
          meta,
          earliestAsOf: priorityDateBucketEarliestAsOf(cell, grain),
        });
      }
    }
  }
  return Array.from(seen.values());
}

/**
 * Earliest USCIS as-of date when a priority-date bucket can appear in inventory.
 * Snapshots before this date cannot contain that cohort (omit chart points).
 * Returns null for the "Earlier" rollup (no start bound).
 */
export function priorityDateBucketEarliestAsOf(
  cell: Pick<I485Cell, 'pd_year' | 'pd_month'>,
  grain: PriorityDateGrain,
): string | null {
  if (cell.pd_year === 0) return null;
  const y = cell.pd_year;
  const m = cell.pd_month;

  if (grain === 'month') {
    return `${y}-${String(m).padStart(2, '0')}-01`;
  }

  if (grain === 'quarter') {
    const startMonth = (calendarQuarter(m) - 1) * 3 + 1;
    return `${y}-${String(startMonth).padStart(2, '0')}-01`;
  }

  if (grain === 'half') {
    const startMonth = calendarHalf(m) === 1 ? 1 : 7;
    return `${y}-${String(startMonth).padStart(2, '0')}-01`;
  }

  const fy = fiscalYear(y, m);
  return `${fy - 1}-10-01`;
}

/**
 * Cohort totals across releases, optionally grouped by snapshot grain
 * (latest snapshot value in each quarter / fiscal year).
 */
export function aggregateCohortBySnapshotGrain(
  cells: I485Cell[],
  releases: I485Release[],
  snapshotGrain: PriorityDateGrain,
  years: number[],
): { meta: TimeBucketMeta; bucket: AggregatedBucket; releaseId: number }[] {
  const filtered = cells.filter((c) => cellInPriorityDateYears(c, years));
  const byRelease = aggregateBy(filtered, (c) => c.release_id);
  return latestReleasesByGrain(releases, snapshotGrain).map(({ meta, release }) => ({
    meta,
    releaseId: release.id,
    bucket: byRelease.get(release.id) ?? { count: 0, suppressedCells: 0 },
  }));
}

/**
 * Cohort multi-series: X = snapshot grain, series = priority-date grain buckets.
 * Each series omits snapshots before that priority-date cohort can exist
 * (e.g. Jan 2026 has no points before the Jan 2026 as-of; Q1 2026 starts at Jan).
 */
export function aggregateCohortSplitByPriorityDate(
  cells: I485Cell[],
  releases: I485Release[],
  snapshotGrain: PriorityDateGrain,
  pdGrain: PriorityDateGrain,
  years: number[],
): SplitPriorityDateResult {
  const filtered = cells.filter((c) => cellInPriorityDateYears(c, years));
  const xPoints = latestReleasesByGrain(releases, snapshotGrain);
  const xAxis = xPoints.map((p) => p.meta);
  const seriesDefs = priorityDateSeriesInYears(years, pdGrain);

  const counts = new Map<string, Map<number, AggregatedBucket>>();
  for (const s of seriesDefs) counts.set(s.meta.key, new Map());

  for (const cell of filtered) {
    const seriesMeta = priorityDateBucket(cell, pdGrain);
    const byRelease = counts.get(seriesMeta.key);
    if (!byRelease) continue;
    const bucket = byRelease.get(cell.release_id) ?? { count: 0, suppressedCells: 0 };
    if (cell.suppressed) bucket.suppressedCells += 1;
    else bucket.count += cell.count ?? 0;
    byRelease.set(cell.release_id, bucket);
  }

  const activeSeries = seriesDefs.filter((s) => {
    const byRelease = counts.get(s.meta.key);
    if (!byRelease) return false;
    return Array.from(byRelease.values()).some((b) => b.count > 0 || b.suppressedCells > 0);
  });

  const series: SplitSeries[] = activeSeries.map((s) => {
    const byRelease = counts.get(s.meta.key)!;
    return {
      key: s.meta.key,
      label: s.meta.label,
      points: xPoints
        .filter(
          ({ release }) =>
            s.earliestAsOf == null || release.as_of_date >= s.earliestAsOf,
        )
        .map(({ meta, release }) => {
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

export interface CohortFacetChart {
  key: string;
  label: string;
  series: { meta: TimeBucketMeta; bucket: AggregatedBucket; releaseId: number }[];
}

/**
 * Cohort small multiples: one monthly snapshot line per facet key
 * (country or category). Facets with no disclosed pending stock are omitted.
 */
export function aggregateCohortFacets(
  cells: I485Cell[],
  releases: I485Release[],
  years: number[],
  facetKeys: string[],
  facetKeyFn: (cell: I485Cell) => string | null,
  facetLabelFn: (key: string) => string,
): CohortFacetChart[] {
  const filtered = cells.filter((c) => cellInPriorityDateYears(c, years));
  const byFacet = new Map<string, I485Cell[]>();
  for (const key of facetKeys) byFacet.set(key, []);

  for (const cell of filtered) {
    const key = facetKeyFn(cell);
    if (key == null) continue;
    const list = byFacet.get(key);
    if (!list) continue;
    list.push(cell);
  }

  return facetKeys.flatMap((key) => {
    const facetCells = byFacet.get(key) ?? [];
    const series = aggregateCohortBySnapshotGrain(facetCells, releases, 'month', years);
    const hasData = series.some(
      (p) => p.bucket.count > 0 || p.bucket.suppressedCells > 0,
    );
    if (!hasData) return [];
    return [{ key, label: facetLabelFn(key), series }];
  });
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
