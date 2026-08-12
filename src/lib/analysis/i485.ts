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
 */
export const CATEGORY_OPTIONS: { value: string; label: string; members: I485Category[] }[] = [
  { value: 'EB5_ALL', label: 'EB-5 (all)', members: ['EB5_UNRESERVED', 'EB5_SET_ASIDE', 'EB5_RURAL', 'EB5_HIGH_UNEMPLOYMENT', 'EB5_INFRASTRUCTURE'] },
  { value: 'EB5_UNRESERVED', label: 'EB-5 Unreserved', members: ['EB5_UNRESERVED'] },
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
  categories?: I485Category[];
  pdYear?: number;
  pdMonth?: number;
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
    if (filters.country) q = q.eq('country', filters.country);
    if (filters.categories && filters.categories.length > 0) q = q.in('category', filters.categories);
    if (filters.pdYear != null) q = q.eq('pd_year', filters.pdYear);
    if (filters.pdMonth != null) q = q.eq('pd_month', filters.pdMonth);
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
