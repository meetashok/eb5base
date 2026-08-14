import { createShareStore } from '@/lib/analysis/createShareStore';
import { sharePayloadToPrefs, type I485SharePayload } from '@/lib/analysis/i485ShareParams';

export const fetchI485Share = createShareStore<I485SharePayload>({
  table: 'i485_shares',
  toPayload: (raw) => {
    const parsed = sharePayloadToPrefs(raw);
    if (!parsed) return null;
    return {
      v: 1,
      view: parsed.prefs.view,
      countries: parsed.prefs.countries,
      categories: parsed.prefs.categories,
      grain: parsed.prefs.grain,
      split: parsed.prefs.split,
      pdYears: parsed.prefs.pdYears,
      comparePdYears: parsed.prefs.comparePdYears,
      cohortPdSplit: parsed.prefs.cohortPdSplit,
      cohortFacetSplit: parsed.prefs.cohortFacetSplit,
      compareFacetSplit: parsed.prefs.compareFacetSplit,
      facetSharedYAxis: parsed.prefs.facetSharedYAxis,
      releaseId: parsed.prefs.releaseId,
      compareFromId: parsed.prefs.compareFromId,
      compareToId: parsed.prefs.compareToId,
      ...(parsed.hide.length > 0 ? { hide: parsed.hide } : {}),
    };
  },
});
