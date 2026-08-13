/**
 * Serialize / parse I-526 explorer filter state for share links and short URLs.
 */
import {
  DEFAULT_COUNTRIES,
  DEFAULT_FORM_A,
  DEFAULT_TEA,
  type FilingCountry,
  type FilingGrain,
  type FilingSplit,
  type ProcessingMetricKey,
  type RatioBothMode,
  type RatioSplit,
} from '@/lib/analysis/i526';
import { I526_TAB_PATHS, type I526TabId } from '@/lib/analysis/i526Routes';
import { SITE_URL } from '@/lib/constants';

export const I526_SHARE_VERSION = 1 as const;

export interface I526SharePayload {
  v: typeof I526_SHARE_VERSION;
  view: I526TabId;
  // Trend / filings
  teas: string[];
  countries: FilingCountry[];
  formA: string[];
  grain: FilingGrain;
  split: FilingSplit;
  showCumulative: boolean;
  trendReleaseIds: number[];
  // Throughput
  formB: string[];
  throughputBIds: number[];
  throughputMetric: ProcessingMetricKey;
  // Rural : HUA ratio
  ratioSplit: RatioSplit;
  ratioBoth: RatioBothMode;
  ratioCumulative: boolean;
}

const DEFAULT_FORM_B = ['KEY_PETITIONS'];
const DEFAULT_THROUGHPUT_METRIC: ProcessingMetricKey = 'q_completions';

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

export function makeSharePayload(p: Partial<I526SharePayload>): I526SharePayload {
  return {
    v: I526_SHARE_VERSION,
    view: p.view ?? 'trend',
    teas: p.teas ?? [...DEFAULT_TEA],
    countries: p.countries ?? [...DEFAULT_COUNTRIES],
    formA: p.formA ?? [...DEFAULT_FORM_A],
    grain: p.grain ?? 'month',
    split: p.split ?? 'form_type',
    showCumulative: p.showCumulative ?? false,
    trendReleaseIds: p.trendReleaseIds ?? [],
    formB: p.formB ?? [...DEFAULT_FORM_B],
    throughputBIds: p.throughputBIds ?? [],
    throughputMetric: p.throughputMetric ?? DEFAULT_THROUGHPUT_METRIC,
    ratioSplit: p.ratioSplit ?? 'none',
    ratioBoth: p.ratioBoth ?? 'exclude',
    ratioCumulative: p.ratioCumulative ?? true,
  };
}

function isPlainStringArray(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    (v as unknown[]).every((x) => typeof x === 'string')
  );
}
function isPlainNumberArray(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    (v as unknown[]).every((x) => typeof x === 'number' && Number.isInteger(x))
  );
}

function validateFilingGrain(v: unknown): FilingGrain {
  if (v === 'month' || v === 'quarter' || v === 'fiscal_year') return v;
  return 'month';
}
function validateFilingSplit(v: unknown): FilingSplit {
  if (v === 'none' || v === 'form_type' || v === 'tea' || v === 'country') return v;
  return 'form_type';
}
function validateRatioSplit(v: unknown): RatioSplit {
  if (v === 'none' || v === 'form_type' || v === 'country') return v;
  return 'none';
}
function validateRatioBoth(v: unknown): RatioBothMode {
  if (v === 'exclude' || v === 'rural' || v === 'split') return v;
  return 'exclude';
}
function validateProcessingMetric(v: unknown): ProcessingMetricKey {
  const ALLOWED: ProcessingMetricKey[] = [
    'q_receipts',
    'q_approvals',
    'q_denials',
    'q_completions',
    'pending',
    'median_processing_months',
  ];
  return ALLOWED.includes(v as ProcessingMetricKey)
    ? (v as ProcessingMetricKey)
    : DEFAULT_THROUGHPUT_METRIC;
}
function validateI526View(v: unknown): I526TabId {
  if (v === 'trend' || v === 'throughput' || v === 'data') return v;
  return 'trend';
}

export function parseSharePayload(raw: unknown): I526SharePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const payload: I526SharePayload = makeSharePayload({
    view: validateI526View(o.view),
    teas: isPlainStringArray(o.teas) ? o.teas : [...DEFAULT_TEA],
    countries: isPlainStringArray(o.countries) ? (o.countries as FilingCountry[]) : [...DEFAULT_COUNTRIES],
    formA: isPlainStringArray(o.formA) ? o.formA : [...DEFAULT_FORM_A],
    grain: validateFilingGrain(o.grain),
    split: validateFilingSplit(o.split),
    showCumulative: typeof o.showCumulative === 'boolean' ? o.showCumulative : false,
    trendReleaseIds: isPlainNumberArray(o.trendReleaseIds) ? o.trendReleaseIds : [],
    formB: isPlainStringArray(o.formB) ? o.formB : [...DEFAULT_FORM_B],
    throughputBIds: isPlainNumberArray(o.throughputBIds) ? o.throughputBIds : [],
    throughputMetric: validateProcessingMetric(o.throughputMetric),
    ratioSplit: validateRatioSplit(o.ratioSplit),
    ratioBoth: validateRatioBoth(o.ratioBoth),
    ratioCumulative: typeof o.ratioCumulative === 'boolean' ? o.ratioCumulative : true,
  });
  return payload;
}

/** Compact query params for address-bar sync / debugging (Share still uses short ids). */
export function sharePayloadToSearchParams(payload: I526SharePayload): URLSearchParams {
  const d = makeSharePayload({ view: payload.view });
  const params = new URLSearchParams();
  if (
    payload.teas.length !== d.teas.length ||
    !arraysEqual(payload.teas, d.teas)
  ) {
    params.set('tea', payload.teas.join(','));
  }
  if (
    payload.countries.length !== d.countries.length ||
    !arraysEqual(payload.countries, d.countries)
  ) {
    params.set('c', payload.countries.join(','));
  }
  if (
    payload.formA.length !== d.formA.length ||
    !arraysEqual(payload.formA, d.formA)
  ) {
    params.set('fa', payload.formA.join(','));
  }
  if (payload.grain !== d.grain) params.set('g', payload.grain);
  if (payload.split !== d.split) params.set('split', payload.split);
  if (payload.showCumulative !== d.showCumulative) {
    params.set('cum', payload.showCumulative ? '1' : '0');
  }
  if (payload.trendReleaseIds.length > 0) {
    params.set('tr', payload.trendReleaseIds.join(','));
  }
  if (
    payload.formB.length !== d.formB.length ||
    !arraysEqual(payload.formB, d.formB)
  ) {
    params.set('fb', payload.formB.join(','));
  }
  if (payload.throughputBIds.length > 0) {
    params.set('tb', payload.throughputBIds.join(','));
  }
  if (payload.throughputMetric !== d.throughputMetric) {
    params.set('tm', payload.throughputMetric);
  }
  if (payload.ratioSplit !== d.ratioSplit) params.set('rsp', payload.ratioSplit);
  if (payload.ratioBoth !== d.ratioBoth) params.set('rb', payload.ratioBoth);
  if (payload.ratioCumulative !== d.ratioCumulative) {
    params.set('rcm', payload.ratioCumulative ? '1' : '0');
  }
  return params;
}

export function searchParamsToSharePayload(
  params: URLSearchParams,
  view: I526TabId,
): I526SharePayload {
  const meaningful = Array.from(params.keys()).filter(
    (k) => !k.startsWith('utm_') && k !== 'fbclid' && k !== 'gclid',
  );
  if (meaningful.length === 0) return makeSharePayload({ view });

  const teaRaw = params.get('tea');
  const cRaw = params.get('c');
  const faRaw = params.get('fa');
  const gRaw = params.get('g');
  const splitRaw = params.get('split');
  const cumRaw = params.get('cum');
  const trRaw = params.get('tr');
  const fbRaw = params.get('fb');
  const tbRaw = params.get('tb');
  const tmRaw = params.get('tm');
  const rspRaw = params.get('rsp');
  const rbRaw = params.get('rb');
  const rcmRaw = params.get('rcm');

  const splitCsv = (s: string | null) =>
    s ? s.split(',').filter(Boolean) : null;
  const splitInts = (s: string | null): number[] | null => {
    if (!s) return null;
    const nums: number[] = [];
    for (const part of s.split(',')) {
      const n = Number(part);
      if (!Number.isInteger(n)) return null;
      nums.push(n);
    }
    return nums;
  };

  return makeSharePayload({
    view,
    teas: splitCsv(teaRaw) ?? [...DEFAULT_TEA],
    countries: (splitCsv(cRaw) as FilingCountry[]) ?? [...DEFAULT_COUNTRIES],
    formA: splitCsv(faRaw) ?? [...DEFAULT_FORM_A],
    grain: validateFilingGrain(gRaw),
    split: validateFilingSplit(splitRaw),
    showCumulative: cumRaw != null ? cumRaw === '1' : undefined,
    trendReleaseIds: splitInts(trRaw) ?? [],
    formB: splitCsv(fbRaw) ?? [...DEFAULT_FORM_B],
    throughputBIds: splitInts(tbRaw) ?? [],
    throughputMetric: validateProcessingMetric(tmRaw),
    ratioSplit: validateRatioSplit(rspRaw),
    ratioBoth: validateRatioBoth(rbRaw),
    ratioCumulative: rcmRaw != null ? rcmRaw === '1' : undefined,
  });
}

export function shortSharePath(id: string): string {
  return `/analysis/i526/s/${id}`;
}

export function shortShareUrl(id: string): string {
  return `${SITE_URL}${shortSharePath(id)}`;
}

export function chartPathWithParams(payload: I526SharePayload): string {
  const path = I526_TAB_PATHS[payload.view];
  const qs = sharePayloadToSearchParams(payload).toString();
  return qs ? `${path}?${qs}` : path;
}

export function shareViewTitle(view: I526TabId): string {
  switch (view) {
    case 'throughput':
      return 'I-526 Throughput & processing';
    case 'data':
      return 'I-526 source data & quarterly releases';
    default:
      return 'I-526 filings by month';
  }
}

/** Nanoid-style short id (URL-safe, ~8 chars). */
export function generateShareId(bytes = 6): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < arr.length; i += 1) {
    out += alphabet[arr[i]! % alphabet.length]!;
  }
  return out;
}

export function isValidShareId(id: string): boolean {
  return /^[0-9a-zA-Z]{6,16}$/.test(id);
}
