/**
 * Serialize / parse I-485 explorer filter state for share links and short URLs.
 */
import {
  DEFAULT_COMPARE_PRIORITY_DATE_YEARS,
  DEFAULT_I485_CATEGORIES,
  DEFAULT_PRIORITY_DATE_YEARS,
  formatPriorityDateYears,
  yearsInPriorityDateSelection,
  type CohortFacetSplit,
  type CohortPdSplit,
  type I485Country,
  type PriorityDateGrain,
  type PriorityDateYearSelection,
  type SnapshotSplit,
} from '@/lib/analysis/i485';
import {
  defaultI485ExplorerPrefs,
  parseI485ExplorerPrefs,
  type I485ExplorerPrefs,
  type I485ViewId,
} from '@/lib/analysis/i485Preferences';
import { pathForI485View } from '@/lib/analysis/i485Routes';
import { SITE_URL } from '@/lib/constants';

export const I485_SHARE_VERSION = 1 as const;

export interface I485SharePayload {
  v: typeof I485_SHARE_VERSION;
  view: I485ViewId;
  countries: I485Country[];
  categories: string[];
  grain: PriorityDateGrain;
  split: SnapshotSplit;
  pdYears: PriorityDateYearSelection;
  comparePdYears: PriorityDateYearSelection;
  cohortPdSplit: CohortPdSplit;
  cohortFacetSplit: CohortFacetSplit;
  compareFacetSplit: CohortFacetSplit;
  facetSharedYAxis: boolean;
  releaseId: number | null;
  compareFromId: number | null;
  compareToId: number | null;
  /** Hidden priority-date series keys (legend). */
  hide?: string[];
}

export function prefsToSharePayload(
  prefs: I485ExplorerPrefs,
  hide: string[] = [],
): I485SharePayload {
  return {
    v: I485_SHARE_VERSION,
    view: prefs.view,
    countries: prefs.countries,
    categories: prefs.categories,
    grain: prefs.grain,
    split: prefs.split,
    pdYears: prefs.pdYears,
    comparePdYears: prefs.comparePdYears,
    cohortPdSplit: prefs.cohortPdSplit,
    cohortFacetSplit: prefs.cohortFacetSplit,
    compareFacetSplit: prefs.compareFacetSplit,
    facetSharedYAxis: prefs.facetSharedYAxis,
    releaseId: prefs.releaseId,
    compareFromId: prefs.compareFromId,
    compareToId: prefs.compareToId,
    ...(hide.length > 0 ? { hide: [...hide] } : {}),
  };
}

export function sharePayloadToPrefs(
  payload: unknown,
  latestYear = new Date().getUTCFullYear(),
): { prefs: I485ExplorerPrefs; hide: string[] } | null {
  if (!payload || typeof payload !== 'object') return null;
  const o = payload as Record<string, unknown>;
  const prefs = parseI485ExplorerPrefs(
    {
      view: o.view,
      countries: o.countries,
      categories: o.categories,
      grain: o.grain,
      split: o.split,
      pdYears: o.pdYears,
      comparePdYears: o.comparePdYears,
      cohortPdSplit: o.cohortPdSplit,
      cohortFacetSplit: o.cohortFacetSplit,
      compareFacetSplit: o.compareFacetSplit,
      facetSharedYAxis: o.facetSharedYAxis,
      compareShowData: false,
      releaseId: o.releaseId,
      compareFromId: o.compareFromId,
      compareToId: o.compareToId,
    },
    latestYear,
  );
  if (!prefs) return null;
  const hide = Array.isArray(o.hide)
    ? o.hide.filter((k): k is string => typeof k === 'string' && k.length > 0).slice(0, 64)
    : [];
  return { prefs, hide };
}

function encodePdYears(sel: PriorityDateYearSelection): string {
  const parts: string[] = [];
  if (sel.years.length > 0) parts.push(sel.years.join(','));
  if (sel.previousEnabled) {
    parts.push(`p${sel.previousFromYear}-${sel.previousToYear}`);
  }
  return parts.join('_');
}

function decodePdYears(
  raw: string | null,
  fallback: PriorityDateYearSelection,
): PriorityDateYearSelection | null {
  if (!raw) return null;
  const years: number[] = [];
  let previousEnabled = false;
  let previousFromYear = fallback.previousFromYear;
  let previousToYear = fallback.previousToYear;
  for (const part of raw.split('_')) {
    if (part.startsWith('p') && part.includes('-')) {
      const [a, b] = part.slice(1).split('-');
      const from = Number(a);
      const to = Number(b);
      if (Number.isInteger(from) && Number.isInteger(to)) {
        previousEnabled = true;
        previousFromYear = from;
        previousToYear = to;
      }
      continue;
    }
    for (const y of part.split(',')) {
      const n = Number(y);
      if (Number.isInteger(n)) years.push(n);
    }
  }
  return { years, previousEnabled, previousFromYear, previousToYear };
}

/** Compact query params for address-bar sync / debugging (Share still uses short ids). */
export function sharePayloadToSearchParams(payload: I485SharePayload): URLSearchParams {
  const defaults = defaultI485ExplorerPrefs();
  const params = new URLSearchParams();
  if (payload.countries.length > 0) params.set('c', payload.countries.join(','));
  if (
    payload.categories.length !== defaults.categories.length ||
    payload.categories.some((c, i) => c !== defaults.categories[i])
  ) {
    params.set('cat', payload.categories.join(','));
  }
  if (payload.grain !== defaults.grain) params.set('g', payload.grain);
  if (payload.split !== defaults.split) params.set('split', payload.split);
  if (payload.releaseId != null) params.set('r', String(payload.releaseId));
  if (payload.compareFromId != null) params.set('from', String(payload.compareFromId));
  if (payload.compareToId != null) params.set('to', String(payload.compareToId));

  const pdEnc = encodePdYears(payload.pdYears);
  const defaultPd = encodePdYears(DEFAULT_PRIORITY_DATE_YEARS);
  if (pdEnc && pdEnc !== defaultPd) params.set('pd', pdEnc);

  const cpdEnc = encodePdYears(payload.comparePdYears);
  const defaultCpd = encodePdYears(DEFAULT_COMPARE_PRIORITY_DATE_YEARS);
  if (cpdEnc && cpdEnc !== defaultCpd) params.set('cpd', cpdEnc);

  if (payload.cohortPdSplit !== defaults.cohortPdSplit) {
    params.set('cpds', payload.cohortPdSplit);
  }
  if (payload.cohortFacetSplit !== defaults.cohortFacetSplit) {
    params.set('cf', payload.cohortFacetSplit);
  }
  if (payload.compareFacetSplit !== defaults.compareFacetSplit) {
    params.set('xf', payload.compareFacetSplit);
  }
  if (payload.facetSharedYAxis !== defaults.facetSharedYAxis) {
    params.set('y', payload.facetSharedYAxis ? '1' : '0');
  }
  if (payload.hide && payload.hide.length > 0) {
    params.set('hide', payload.hide.join(','));
  }
  return params;
}

export function searchParamsToSharePayload(
  params: URLSearchParams,
  view: I485ViewId,
  latestYear = new Date().getUTCFullYear(),
): I485SharePayload | null {
  const meaningful = Array.from(params.keys()).filter(
    (k) => !k.startsWith('utm_') && k !== 'fbclid' && k !== 'gclid',
  );
  if (meaningful.length === 0) return null;

  const defaults = defaultI485ExplorerPrefs();
  const countriesRaw = params.get('c');
  const catRaw = params.get('cat');
  const pd = decodePdYears(params.get('pd'), DEFAULT_PRIORITY_DATE_YEARS);
  const cpd = decodePdYears(params.get('cpd'), DEFAULT_COMPARE_PRIORITY_DATE_YEARS);
  const hideRaw = params.get('hide');

  const raw = {
    view,
    countries: countriesRaw ? countriesRaw.split(',').filter(Boolean) : [],
    categories: catRaw ? catRaw.split(',').filter(Boolean) : [...DEFAULT_I485_CATEGORIES],
    grain: params.get('g') ?? defaults.grain,
    split: params.get('split') ?? defaults.split,
    pdYears: pd ?? { ...DEFAULT_PRIORITY_DATE_YEARS },
    comparePdYears: cpd ?? { ...DEFAULT_COMPARE_PRIORITY_DATE_YEARS },
    cohortPdSplit: params.get('cpds') ?? defaults.cohortPdSplit,
    cohortFacetSplit: params.get('cf') ?? defaults.cohortFacetSplit,
    compareFacetSplit: params.get('xf') ?? defaults.compareFacetSplit,
    facetSharedYAxis: params.has('y') ? params.get('y') === '1' : true,
    releaseId: params.get('r'),
    compareFromId: params.get('from'),
    compareToId: params.get('to'),
    hide: hideRaw ? hideRaw.split(',').filter(Boolean) : [],
  };

  const parsed = sharePayloadToPrefs(raw, latestYear);
  if (!parsed) return null;
  return prefsToSharePayload(parsed.prefs, parsed.hide);
}

export function shortSharePath(id: string): string {
  return `/analysis/i485/s/${id}`;
}

export function shortShareUrl(id: string): string {
  return `${SITE_URL}${shortSharePath(id)}`;
}

export function chartPathWithParams(payload: I485SharePayload): string {
  const path = pathForI485View(payload.view);
  const qs = sharePayloadToSearchParams(payload).toString();
  return qs ? `${path}?${qs}` : path;
}

export function shareViewTitle(view: I485ViewId): string {
  switch (view) {
    case 'compare':
      return 'Change in pending I-485 between two snapshots';
    case 'cohort':
      return 'Pending I-485 across USCIS snapshots';
    default:
      return 'Pending I-485 by priority date';
  }
}

export function shareFilterSummary(
  payload: I485SharePayload,
  latestYear = new Date().getUTCFullYear(),
): string {
  const parts: string[] = [];
  if (payload.categories.length > 0) {
    parts.push(payload.categories.join(', '));
  }
  parts.push(
    payload.countries.length === 0 ? 'all countries' : payload.countries.join(', '),
  );
  const years =
    payload.view === 'compare'
      ? yearsInPriorityDateSelection(payload.comparePdYears, latestYear)
      : payload.view === 'cohort'
        ? yearsInPriorityDateSelection(payload.pdYears, latestYear)
        : [];
  if (years.length > 0) {
    parts.push(`priority dates ${formatPriorityDateYears(years)}`);
  }
  return parts.join(' · ');
}

export { generateShareId, isValidShareId } from '@/lib/analysis/shareId';
