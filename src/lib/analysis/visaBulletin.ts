import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

function clientOrBrowser(client?: SupabaseClient) {
  return client ?? createClient();
}

export type EbPreference = 'EB1' | 'EB2' | 'EB3' | 'EB4' | 'EB5';
export type VbCountry = 'WORLDWIDE' | 'CHINA' | 'INDIA' | 'MEXICO' | 'PHILIPPINES' | 'VIETNAM';
export type VbDateType = 'FINAL_ACTION' | 'FILING';
export type VbStatus = 'DATE' | 'CURRENT' | 'UNAVAILABLE';

/** EB-5 sub-categories are the focus; other prefs use MAIN / worker splits. */
export type Eb5Subcategory =
  | 'UNRESERVED'
  | 'RURAL'
  | 'HIGH_UNEMPLOYMENT'
  | 'INFRASTRUCTURE'
  | 'REGIONAL_CENTER';

export interface VisaBulletinRelease {
  id: number;
  bulletin_month: string; // YYYY-MM-DD (first of month)
  fiscal_year: number | null;
  published_date: string | null;
  source_url: string;
  source_title: string | null;
}

export interface VisaBulletinDate {
  release_id: number;
  preference: EbPreference;
  subcategory: string;
  country: VbCountry;
  date_type: VbDateType;
  status: VbStatus;
  cutoff_date: string | null; // non-null only when status = DATE
}

export const EB5_SUBCATEGORY_LABELS: Record<string, string> = {
  UNRESERVED: 'Unreserved',
  RURAL: 'Set-aside: Rural (20%)',
  HIGH_UNEMPLOYMENT: 'Set-aside: High Unemployment (10%)',
  INFRASTRUCTURE: 'Set-aside: Infrastructure (2%)',
  REGIONAL_CENTER: 'Regional Center (pre-RIA)',
};

export const COUNTRY_LABELS: Record<VbCountry, string> = {
  WORLDWIDE: 'Worldwide',
  CHINA: 'China',
  INDIA: 'India',
  MEXICO: 'Mexico',
  PHILIPPINES: 'Philippines',
  VIETNAM: 'Vietnam',
};

export async function fetchVisaBulletinReleases(
  client?: SupabaseClient,
): Promise<VisaBulletinRelease[]> {
  const supabase = clientOrBrowser(client);
  const { data, error } = await supabase
    .from('visa_bulletin_releases')
    .select('id, bulletin_month, fiscal_year, published_date, source_url, source_title')
    .order('bulletin_month', { ascending: true });
  if (error) throw error;
  return (data ?? []) as VisaBulletinRelease[];
}

export interface VbDateFilter {
  preference?: EbPreference;
  dateType?: VbDateType;
  countries?: VbCountry[];
  subcategories?: string[];
}

/** Paginated fetch of cut-off rows (table can exceed the 1000-row cap). */
export async function fetchVisaBulletinDates(
  filter: VbDateFilter = {},
  client?: SupabaseClient,
): Promise<VisaBulletinDate[]> {
  const supabase = clientOrBrowser(client);
  const pageSize = 1000;
  const out: VisaBulletinDate[] = [];
  for (let from = 0; ; from += pageSize) {
    let q = supabase
      .from('visa_bulletin_dates')
      .select('release_id, preference, subcategory, country, date_type, status, cutoff_date')
      .order('release_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (filter.preference) q = q.eq('preference', filter.preference);
    if (filter.dateType) q = q.eq('date_type', filter.dateType);
    if (filter.countries?.length) q = q.in('country', filter.countries);
    if (filter.subcategories?.length) q = q.in('subcategory', filter.subcategories);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as VisaBulletinDate[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

/** Encode an ISO date as days-since-epoch for a numeric chart Y-axis. */
export function dateToOrdinal(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
}

/** Signed month-over-month movement in days (positive = advanced forward). */
export function cutoffDeltaDays(prev: string | null, next: string | null): number | null {
  if (!prev || !next) return null;
  return dateToOrdinal(next) - dateToOrdinal(prev);
}
