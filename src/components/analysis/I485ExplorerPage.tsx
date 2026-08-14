import Link from 'next/link';
import PageHero from '@/components/PageHero';
import I485Explorer from '@/components/analysis/I485Explorer';
import type { I485ViewId } from '@/components/analysis/I485ViewBar';
import {
  DEFAULT_I485_CATEGORIES,
  categoryMembersForMany,
  fetchI485Cells,
  fetchI485Releases,
  isI485DataAvailable,
  type I485Cell,
  type I485Release,
} from '@/lib/analysis/i485';
import { createClient } from '@/lib/supabase-server';

export async function loadInitialInventory(): Promise<{
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
        categories: categoryMembersForMany(DEFAULT_I485_CATEGORIES),
      },
      supabase,
    );
    return { releases, releaseId, cells, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { releases: [], releaseId: null, cells: null, error: message };
  }
}

export default async function I485ExplorerPage({ view }: { view: I485ViewId }) {
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
        subtitle="USCIS publishes a monthly count of pending adjustment-of-status applications by preference category, country of chargeability, and priority date. See the queue at any snapshot, compare two dates, or follow how a priority-date cohort has moved since February 2024."
      />

      <I485Explorer
        initialView={view}
        initialReleases={initial.releases}
        initialReleaseId={initial.releaseId}
        initialSnapshotCells={initial.cells}
        initialError={initial.error}
      />
    </div>
  );
}
