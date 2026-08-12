import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import I485Explorer from '@/components/analysis/I485Explorer';
import {
  CATEGORY_OPTIONS,
  fetchI485Cells,
  fetchI485Releases,
  isI485DataAvailable,
  type I485Cell,
  type I485Release,
} from '@/lib/analysis/i485';
import { createClient } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: 'I-485 Pending Inventory - USCIS employment-based data | EB5 Base',
  description:
    'Explore monthly USCIS snapshots of pending employment-based I-485 applications by preference category (EB-1 through EB-5 set-asides), country of chargeability, and priority date. February 2024 to present.',
  alternates: { canonical: 'https://eb5base.com/analysis/i485' },
  openGraph: {
    title: 'I-485 Pending Inventory Explorer',
    description:
      'Monthly USCIS pending I-485 inventory by category, country, and priority date - snapshot views and cohort tracking.',
    url: 'https://eb5base.com/analysis/i485',
  },
};

export const dynamic = 'force-dynamic';

async function loadInitialInventory(): Promise<{
  releases: I485Release[];
  releaseId: number | null;
  cells: I485Cell[] | null;
  error: string | null;
}> {
  if (!isI485DataAvailable()) {
    return { releases: [], releaseId: null, cells: null, error: null };
  }

  try {
    const supabase = createClient();
    const releases = await fetchI485Releases(supabase);
    if (releases.length === 0) {
      return { releases, releaseId: null, cells: null, error: null };
    }
    const releaseId = releases[releases.length - 1].id;
    const cells = await fetchI485Cells(
      {
        releaseId,
        categories: CATEGORY_OPTIONS[0].members,
      },
      supabase,
    );
    return { releases, releaseId, cells, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { releases: [], releaseId: null, cells: null, error: message };
  }
}

export default async function I485InventoryPage() {
  const initial = await loadInitialInventory();

  return (
    <div>
      <PageHero
        eyebrow={
          <span>
            <Link href="/analysis" className="hover:underline">
              Analysis
            </Link>{' '}
            / I-485 Pending Inventory
          </span>
        }
        title="Employment-based I-485 pending inventory"
        subtitle="USCIS publishes a monthly count of pending adjustment-of-status applications by preference category, country of chargeability, and priority date. See the queue at any snapshot, or follow how a priority-date cohort has moved since February 2024."
      />

      <section className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <I485Explorer
          initialReleases={initial.releases}
          initialReleaseId={initial.releaseId}
          initialSnapshotCells={initial.cells}
          initialError={initial.error}
        />

        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 text-sm text-neutral leading-relaxed space-y-2">
          <h2 className="text-sm font-bold text-primary">How to read this data</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Counts are <span className="font-semibold">pending applications at USCIS</span> on
              the snapshot date - filed I-485s that have not yet been approved, denied, or
              withdrawn. They exclude consular cases at the Department of State and anyone who has
              not filed an I-485 yet.
            </li>
            <li>
              A cohort shrinking between snapshots usually means cases completed, but USCIS does
              not publish adjudications in this report, so new filings and completions are mixed
              together in the monthly change.
            </li>
            <li>
              Values under 10 are suppressed by USCIS (shown as &quot;D&quot; in the source files).
              We exclude them from totals and note how many are hidden in your selection.
            </li>
            <li>
              EB-5 set-aside categories (Rural, High Unemployment, Infrastructure) are reported
              separately starting with the August 2024 snapshot; earlier 2024 reports lump them
              together, which we label as the legacy set-aside bucket.
            </li>
            <li>
              USCIS publishes snapshots with a lag of roughly one to five months, and the June and
              July 2025 snapshots were never published.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
