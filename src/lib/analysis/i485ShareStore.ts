import {
  isValidShareId,
  sharePayloadToPrefs,
  type I485SharePayload,
} from '@/lib/analysis/i485ShareParams';
import { createClient } from '@/lib/supabase-server';
import { isSupabaseConfigured } from '@/lib/supabase-env';

export async function fetchI485Share(
  id: string,
): Promise<{ id: string; payload: I485SharePayload } | null> {
  if (!isValidShareId(id) || !isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('i485_shares')
      .select('id, payload')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    const parsed = sharePayloadToPrefs(data.payload);
    if (!parsed) return null;
    return {
      id: data.id as string,
      payload: {
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
      },
    };
  } catch {
    return null;
  }
}
