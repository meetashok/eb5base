import Link from 'next/link';
import PageHero from '@/components/PageHero';
import I526Explorer from '@/components/analysis/I526Explorer';
import I526ViewBar, { type I526ViewId } from '@/components/analysis/I526ViewBar';
import AnalysisDatasetCrumb from '@/components/analysis/AnalysisDatasetCrumb';
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
    const latestAFilingReleaseIds = aReleases.slice(-2).map((r) => r.id);
    const latestBReleaseIds = bReleases.slice(-2).map((r) => r.id);

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

function HowToRead() {
  return (
    <section className="max-w-4xl mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 text-sm text-neutral leading-relaxed space-y-2">
        <h2 className="text-sm font-bold text-primary">How to read this data</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <span className="font-semibold">I-526 filings data:</span> USCIS{' '}
            <span className="font-semibold">receipts</span> per Form I-526 (standalone) or I-526E
            (regional center) per country of birth, per TEA set-aside category, per receipt month.
          </li>
          <li>
            <span className="font-semibold">Throughput &amp; processing data:</span> Service-wide
            throughput (receipts, approvals, denials, completions, pending, median processing
            months) — aggregated across all countries/categories for the whole EB-5 family.
          </li>
          <li>
            I-526 legacy = petitions filed before the RIA. These are a legacy pipeline; no new
            receipts today but approvals/denials continue. New I-526 standalone = post-RIA
            non-regional center filings.
          </li>
          <li>
            The TEA &quot;Rural &amp; High-UE combined&quot; bucket is reported separately by USCIS
            in some reports - it is <span className="font-semibold">not</span> a double-count of
            Rural + High unemployment.
          </li>
          <li>
            Suppression: values 1-10 masked as D/H; treated as 0 in sums, flagged as suppressed
            cells in the footer.
          </li>
          <li>
            Median processing time is USCIS-reported median months from receipt to completion for
            petitions finalized during the quarter; it is not the wait time a filer experiences
            today.
          </li>
          <li>
            Publication cadence is quarterly, ~10-12 weeks after quarter end. FY26 Q3 and Q4 are
            not yet posted as of this build.
          </li>
        </ul>
      </div>
    </section>
  );
}

export default async function I526ExplorerPage({ view }: { view: I526ViewId }) {
  const initial = await loadInitialI526();

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
        title="I-526 / I-526E filings & EB-5 throughput"
        subtitle="Quarterly USCIS data on EB-5 petition receipts by country and TEA set-aside, plus service-wide adjudications and processing times for the whole EB-5 family (I-526 legacy, I-526 standalone, I-526E, I-829, and I-956 regional center forms)."
      />

      <I526ViewBar active={view} />

      <I526Explorer
        initialView={view}
        initialReleases={initial.releases}
        initialLatestAIds={initial.latestAFilingReleaseIds}
        initialLatestBIds={initial.latestBReleaseIds}
        initialFilingCells={initial.filingCells}
        initialProcessingRows={initial.processingRows}
        initialError={initial.error}
      />

      <HowToRead />
    </div>
  );
}
