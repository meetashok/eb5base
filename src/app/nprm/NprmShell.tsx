import Link from 'next/link';
import { Suspense } from 'react';
import PageHero from '@/components/PageHero';
import NprmClient from '@/components/nprm/NprmClient';
import { loadNprmPageData } from '@/lib/nprm/fetch';
import type { NprmTabId } from '@/lib/nprm/tabs';
import { DOCKET_URL } from '@/lib/nprm/utils';

export default async function NprmShell({ tab }: { tab: NprmTabId }) {
  const data = await loadNprmPageData();

  return (
    <div className="nprm-page">
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
          <div className="space-y-1.5 text-sm md:text-[0.95rem] text-neutral max-w-2xl leading-relaxed">
            <p>
              USCIS published this NPRM on July 2, 2026 (91 FR 40676, RIN 1615-AC94).
              Start with a plain-English explainer of what the proposal itself says,
              then browse comments by theme. Comments close Aug 31, 2026 at 11:59pm ET.
            </p>
            <p>
              Draft a distinct comment with your own LLM and file it on regulations.gov.{' '}
              <Link
                href="/nprm/about#disclaimer"
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
        <NprmClient data={data} tab={tab} />
      </Suspense>
    </div>
  );
}
