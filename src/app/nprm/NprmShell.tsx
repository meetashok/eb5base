import { Suspense } from 'react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import NprmClient from '@/components/nprm/NprmClient';
import { loadNprmPageData } from '@/lib/nprm/fetch';
import type { NprmTabId } from '@/lib/nprm/tabs';
import {
  DOCKET_URL,
  FR_HTML,
  NPRM_LAST_UPDATED,
} from '@/lib/nprm/utils';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'EB-5 NPRM 2026: Plain-English Guide to DHS Proposed Rule',
  datePublished: '2026-07-02',
  dateModified: NPRM_LAST_UPDATED,
  author: { '@type': 'Organization', name: 'EB5 Base' },
  publisher: { '@type': 'Organization', name: 'EB5 Base', url: 'https://eb5base.com' },
  mainEntityOfPage: 'https://eb5base.com/nprm',
  description:
    'Plain-English guide to the July 2 2026 EB-5 Notice of Proposed Rulemaking. Comment deadline August 31, 2026.',
};

export default async function NprmShell({ tab }: { tab: NprmTabId }) {
  const data = await loadNprmPageData();

  return (
    <div className="nprm-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
        title="The EB-5 Proposed Rule is Here"
        subtitle={
          <div className="space-y-1.5 text-sm md:text-[0.95rem] text-neutral max-w-2xl leading-relaxed">
            <p>
              DHS Notice of Proposed Rulemaking, July 2, 2026. EB5 Base breaks down
              the 358-page rule that finally codifies the EB-5 Reform and Integrity
              Act of 2022. Comments close August 31, 2026.
            </p>
            <p>
              Last data updated: {NPRM_LAST_UPDATED} ·{' '}
              <a
                href={FR_HTML}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-secondary underline underline-offset-2"
              >
                Federal Register
              </a>
              {' · '}
              <Link
                href="/about#disclaimer"
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
            <ListSkeleton count={3} />
          </div>
        }
      >
        <NprmClient data={data} tab={tab} />
      </Suspense>
    </div>
  );
}
