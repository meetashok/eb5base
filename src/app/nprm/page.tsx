import { Suspense } from 'react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import NprmBareHeader from '@/components/nprm/NprmBareHeader';
import NprmClient from '@/components/nprm/NprmClient';
import { loadNprmPageData } from '@/lib/nprm/fetch';
import { hasMaintenanceBypass, isMaintenanceMode } from '@/lib/maintenance';
import { DOCKET_URL } from '@/lib/nprm/utils';

// Request-time so feed + maintenance chrome stay fresh (comment window is time-sensitive).
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function NprmPage() {
  const data = await loadNprmPageData();
  const showBareHeader = isMaintenanceMode() && !hasMaintenanceBypass();

  return (
    <div className="nprm-page">
      {showBareHeader && <NprmBareHeader />}
      <PageHero
        eyebrow={
          <a
            href={DOCKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline underline-offset-4 decoration-secondary/50"
          >
            Docket USCIS-2026-0100
            <span className="text-[10px] font-semibold normal-case tracking-normal opacity-80">
              ↗ regulations.gov
            </span>
          </a>
        }
        title="Comment on the EB-5 Proposed Rule"
        subtitle={
          <div className="space-y-2">
            <p>
              On July 2, 2026, USCIS published an NPRM (91 FR 40676, RIN 1615-AC94)
              that would rewrite core EB-5 mechanics for post-RIA investors —
              grandfathering/retroactivity, the 2-year sustainment period, bridge
              financing, TEA lock, and related definitions. The public comment
              window closes Aug 31, 2026, 11:59pm ET.
            </p>
            <p className="text-sm md:text-base text-neutral/80">
              This page helps you read the real docket comments by theme and
              draft a distinct personal comment via your own LLM — then file it
              yourself on regulations.gov.{' '}
              <Link
                href="/nprm?tab=about#disclaimer"
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                Not legal advice
              </Link>
            </p>
          </div>
        }
      />
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="skeleton-shimmer h-10 w-full max-w-xl mb-6" />
            <div className="skeleton-shimmer h-64 w-full" />
          </div>
        }
      >
        <NprmClient data={data} />
      </Suspense>
    </div>
  );
}
