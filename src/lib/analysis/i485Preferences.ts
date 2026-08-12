/**
 * Persist I-485 explorer filter / view choices in localStorage so return
 * visits keep the same country, category, and chart controls.
 */
import {
  COHORT_FACET_SPLIT_OPTIONS,
  COHORT_PD_SPLIT_OPTIONS,
  COHORT_PREVIOUS_YEAR_MIN,
  COHORT_RECENT_YEAR_START,
  COUNTRY_OPTIONS,
  DEFAULT_COMPARE_PRIORITY_DATE_YEARS,
  DEFAULT_I485_CATEGORIES,
  DEFAULT_PRIORITY_DATE_YEARS,
  EB5_CATEGORY_BUTTONS,
  OTHER_CATEGORY_BUTTONS,
  SNAPSHOT_SPLIT_OPTIONS,
  normalizePriorityDateYearSelection,
  type CohortFacetSplit,
  type CohortPdSplit,
  type I485Country,
  type PriorityDateGrain,
  type PriorityDateYearSelection,
  type SnapshotSplit,
} from '@/lib/analysis/i485';

export const I485_PREFS_STORAGE_KEY = 'eb5base:i485-explorer:v1';

export type I485ViewId = 'snapshot' | 'cohort' | 'compare';

export interface I485ExplorerPrefs {
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
  compareShowData: boolean;
  /** Snapshot as-of release id, when still present in the catalog. */
  releaseId: number | null;
  compareFromId: number | null;
  compareToId: number | null;
}

const VIEWS = new Set<I485ViewId>(['snapshot', 'cohort', 'compare']);
const SNAPSHOT_GRAINS = new Set<PriorityDateGrain>(['month', 'quarter', 'year']);
const COUNTRY_VALUES = new Set(
  COUNTRY_OPTIONS.map((o) => o.value).filter((v): v is I485Country => v !== 'all'),
);
const CATEGORY_VALUES = new Set([
  ...EB5_CATEGORY_BUTTONS.map((o) => o.value),
  ...OTHER_CATEGORY_BUTTONS.map((o) => o.value),
]);
const SPLITS = new Set(SNAPSHOT_SPLIT_OPTIONS.map((o) => o.value));
const COHORT_PD = new Set(COHORT_PD_SPLIT_OPTIONS.map((o) => o.value));
const COHORT_FACET = new Set(COHORT_FACET_SPLIT_OPTIONS.map((o) => o.value));

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function sanitizeCountries(raw: unknown): I485Country[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((c): c is I485Country => typeof c === 'string' && COUNTRY_VALUES.has(c as I485Country));
}

function sanitizeCategories(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_I485_CATEGORIES];
  const next = raw.filter((c): c is string => typeof c === 'string' && CATEGORY_VALUES.has(c));
  return next.length > 0 ? next : [...DEFAULT_I485_CATEGORIES];
}

function sanitizePdYears(raw: unknown, latestYear: number): PriorityDateYearSelection {
  if (!raw || typeof raw !== 'object') {
    return normalizePriorityDateYearSelection({ ...DEFAULT_PRIORITY_DATE_YEARS }, latestYear);
  }
  const o = raw as Record<string, unknown>;
  const years = Array.isArray(o.years)
    ? o.years.filter((y): y is number => typeof y === 'number' && Number.isInteger(y))
    : [];
  return normalizePriorityDateYearSelection(
    {
      years,
      previousEnabled: Boolean(o.previousEnabled),
      previousFromYear:
        typeof o.previousFromYear === 'number' ? o.previousFromYear : COHORT_PREVIOUS_YEAR_MIN,
      previousToYear:
        typeof o.previousToYear === 'number' ? o.previousToYear : COHORT_RECENT_YEAR_START - 1,
    },
    latestYear,
  );
}

export function defaultI485ExplorerPrefs(): I485ExplorerPrefs {
  return {
    view: 'snapshot',
    countries: [],
    categories: [...DEFAULT_I485_CATEGORIES],
    grain: 'quarter',
    split: 'none',
    pdYears: { ...DEFAULT_PRIORITY_DATE_YEARS },
    comparePdYears: { ...DEFAULT_COMPARE_PRIORITY_DATE_YEARS },
    cohortPdSplit: 'quarter',
    cohortFacetSplit: 'none',
    compareFacetSplit: 'none',
    compareShowData: false,
    releaseId: null,
    compareFromId: null,
    compareToId: null,
  };
}

/** Parse and validate a stored prefs blob. Returns null if unusable. */
export function parseI485ExplorerPrefs(
  raw: unknown,
  latestYear = new Date().getUTCFullYear(),
): I485ExplorerPrefs | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const view = typeof o.view === 'string' && VIEWS.has(o.view as I485ViewId) ? (o.view as I485ViewId) : 'snapshot';
  const grainRaw = typeof o.grain === 'string' ? o.grain : 'quarter';
  const grain = SNAPSHOT_GRAINS.has(grainRaw as PriorityDateGrain)
    ? (grainRaw as PriorityDateGrain)
    : 'quarter';
  const split =
    typeof o.split === 'string' && SPLITS.has(o.split as SnapshotSplit)
      ? (o.split as SnapshotSplit)
      : 'none';
  const cohortPdSplit =
    typeof o.cohortPdSplit === 'string' && COHORT_PD.has(o.cohortPdSplit as CohortPdSplit)
      ? (o.cohortPdSplit as CohortPdSplit)
      : 'quarter';
  const cohortFacetSplit =
    typeof o.cohortFacetSplit === 'string' &&
    COHORT_FACET.has(o.cohortFacetSplit as CohortFacetSplit)
      ? (o.cohortFacetSplit as CohortFacetSplit)
      : 'none';
  const compareFacetSplit =
    typeof o.compareFacetSplit === 'string' &&
    COHORT_FACET.has(o.compareFacetSplit as CohortFacetSplit)
      ? (o.compareFacetSplit as CohortFacetSplit)
      : 'none';

  return {
    view,
    countries: sanitizeCountries(o.countries),
    categories: sanitizeCategories(o.categories),
    grain,
    split,
    pdYears: sanitizePdYears(o.pdYears, latestYear),
    comparePdYears: sanitizePdYears(
      o.comparePdYears ?? DEFAULT_COMPARE_PRIORITY_DATE_YEARS,
      latestYear,
    ),
    cohortPdSplit,
    cohortFacetSplit,
    compareFacetSplit,
    compareShowData: Boolean(o.compareShowData),
    releaseId: asNumber(o.releaseId),
    compareFromId: asNumber(o.compareFromId),
    compareToId: asNumber(o.compareToId),
  };
}

export function loadI485ExplorerPrefs(
  latestYear = new Date().getUTCFullYear(),
): I485ExplorerPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(I485_PREFS_STORAGE_KEY);
    if (!raw) return null;
    return parseI485ExplorerPrefs(JSON.parse(raw), latestYear);
  } catch {
    return null;
  }
}

export function saveI485ExplorerPrefs(prefs: I485ExplorerPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(I485_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Quota / private mode — ignore.
  }
}

/** Keep release ids only if they still exist in the catalog. */
export function resolveStoredReleaseIds(
  prefs: Pick<I485ExplorerPrefs, 'releaseId' | 'compareFromId' | 'compareToId'>,
  releaseIds: number[],
): Pick<I485ExplorerPrefs, 'releaseId' | 'compareFromId' | 'compareToId'> {
  const set = new Set(releaseIds);
  return {
    releaseId: prefs.releaseId != null && set.has(prefs.releaseId) ? prefs.releaseId : null,
    compareFromId:
      prefs.compareFromId != null && set.has(prefs.compareFromId) ? prefs.compareFromId : null,
    compareToId:
      prefs.compareToId != null && set.has(prefs.compareToId) ? prefs.compareToId : null,
  };
}
