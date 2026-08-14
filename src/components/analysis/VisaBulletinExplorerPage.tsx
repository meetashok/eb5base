import Link from 'next/link';
import PageHero from '@/components/PageHero';
import VisaBulletinExplorer from '@/components/analysis/VisaBulletinExplorer';
import {
  fetchVisaBulletinDates,
  fetchVisaBulletinReleases,
  type VisaBulletinDate,
  type VisaBulletinRelease,
} from '@/lib/analysis/visaBulletin';
import { createClient } from '@/lib/supabase-server';

export async function loadVisaBulletin(): Promise<{
  releases: VisaBulletinRelease[];
  dates: VisaBulletinDate[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    const releases = await fetchVisaBulletinReleases(supabase);
    if (releases.length === 0) return { releases, dates: [], error: null };
    const dates = await fetchVisaBulletinDates({}, supabase);
    return { releases, dates, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { releases: [], dates: [], error: message };
  }
}

export default async function VisaBulletinExplorerPage() {
  const initial = await loadVisaBulletin();

  return (
    <div>
      <PageHero
        eyebrow={
          <span>
            <Link href="/analysis" className="hover:underline">
              Analysis
            </Link>{' '}
            / Visa Bulletin
          </span>
        }
        title="EB-5 Visa Bulletin over time"
        subtitle="The monthly State Department Visa Bulletin, restructured for EB-5: read any month's cut-off table (with movement and filing-date gaps), and track Final Action or Dates for Filing across bulletins by country - split into Unreserved and the RIA set-asides."
      />

      <VisaBulletinExplorer
        releases={initial.releases}
        dates={initial.dates}
        error={initial.error}
      />
    </div>
  );
}
