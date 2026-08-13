import Link from 'next/link';
import PageHero from '@/components/PageHero';
import I526Explorer from '@/components/analysis/I526Explorer';
import I526ViewBar, { type I526ViewId } from '@/components/analysis/I526ViewBar';
import AnalysisDatasetCrumb from '@/components/analysis/AnalysisDatasetCrumb';
import { searchParamsToSharePayload } from '@/lib/analysis/i526ShareParams';
import {
  DEFAULT_COUNTRIES,
  DEFAULT_FORM_A,
  DEFAULT_FORM_B_SINGLE,
  DEFAULT_TEA,
  fetchI526FilingCells,
  fetchI526Processing,
  fetchI526Releases,
  isI526DataAvailable,
  resolveFilterMembers,
  FORM_FILTERS_A,
  TEA_FILTER_OPTIONS,
  COUNTRY_FILTER_OPTIONS,
  type FilingCountry,
  type I526FilingCell,
  type I526ProcessingRow,
  type I526Release,
  type ProcessingFormType,
  type TeaCategory,
  type FilingFormType,
} from '@/lib/analysis/i526';
import { createClient } from '@/lib/supabase-server';

export async function loadInitialI526(): Promise<{
  releases: I526Release[];
  latestAFilingReleaseIds: number[];
  latestBReleaseIds: number[];
  filingCells: I526FilingCell[] | null;
  processingRows: I526ProcessingRow[] | null;
  error: string | null;
}> {
  if (!isI526DataAvailable()) {
    return {
      releases: [],
      latestAFilingReleaseIds: [],
      latestBReleaseIds: [],
      filingCells: null,
      processingRows: null,
      error: null,
    };
  }

  try {
    const supabase = createClient();
    const releases = await fetchI526Releases(undefined, supabase);
    if (releases.length === 0) {
      return {
        releases,
        latestAFilingReleaseIds: [],
        latestBReleaseIds: [],
        filingCells: null,
        processingRows: null,
        error: null,
      };
    }
    const aReleases = releases.filter((r) => r.dataset === 'FILINGS_COUNTRY_TEA');
    const bReleases = releases.filter((r) => r.dataset === 'ALL_FORMS_SUMMARY');
    // Time-series charts show the full receipt-period history, so seed with every
    // release (not just the latest). The default form/TEA/country filter keeps the
    // SSR payload small, and the client reuses this data without a refetch.
    const latestAFilingReleaseIds = aReleases.map((r) => r.id);
    const latestBReleaseIds = bReleases.map((r) => r.id);

    const formMembers = resolveFilterMembers(FORM_FILTERS_A, DEFAULT_FORM_A) as FilingFormType[];
    const teaMembers = resolveFilterMembers(TEA_FILTER_OPTIONS, DEFAULT_TEA) as TeaCategory[];
    const countryMembers = resolveFilterMembers(
      COUNTRY_FILTER_OPTIONS,
      DEFAULT_COUNTRIES,
    ) as FilingCountry[];

    const filingCells =
      latestAFilingReleaseIds.length > 0
        ? await fetchI526FilingCells(
            {
              releaseIds: latestAFilingReleaseIds,
              formTypes: formMembers,
              teas: teaMembers,
              countries: countryMembers,
            },
            supabase,
          )
        : [];

    const processingRows =
      latestBReleaseIds.length > 0
        ? await fetchI526Processing(
            {
              releaseIds: latestBReleaseIds,
              formTypes: [DEFAULT_FORM_B_SINGLE as ProcessingFormType, 'I526_STANDALONE'],
            },
            supabase,
          )
        : [];

    return {
      releases,
      latestAFilingReleaseIds,
      latestBReleaseIds,
      filingCells,
      processingRows,
      error: null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return {
      releases: [],
      latestAFilingReleaseIds: [],
      latestBReleaseIds: [],
      filingCells: null,
      processingRows: null,
      error: message,
    };
  }
}

function toURLSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) {
      for (const v of value) usp.append(key, v);
    } else if (value != null) {
      usp.set(key, value);
    }
  }
  return usp;
}

export default async function I526ExplorerPage({
  view,
  searchParams,
}: {
  view: I526ViewId;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const initial = await loadInitialI526();
  // Parse filter prefs from the URL on the server so SSR and the first client
  // render match (avoids a hydration mismatch from reading window during render).
  const initialSharePayload = searchParams
    ? searchParamsToSharePayload(toURLSearchParams(searchParams), view)
    : null;

  return (
    <div>
      <PageHero
        eyebrow={
          <span>
            <Link href="/analysis" className="hover:underline">
              Analysis
            </Link>{' '}
            / <AnalysisDatasetCrumb current="i526" />
          </span>
        }
        title="I-526 / I-526E filings"
        subtitle="Quarterly USCIS data on EB-5 petition receipts by country and TEA set-aside category (I-526 standalone and I-526E regional center)."
      />

      <I526ViewBar active={view} />

      <I526Explorer
        initialView={view}
        initialSharePayload={initialSharePayload}
        initialReleases={initial.releases}
        initialLatestAIds={initial.latestAFilingReleaseIds}
        initialLatestBIds={initial.latestBReleaseIds}
        initialFilingCells={initial.filingCells}
        initialProcessingRows={initial.processingRows}
        initialError={initial.error}
      />
    </div>
  );
}
