import Link from 'next/link';
import { Suspense } from 'react';
import PageHero from '@/components/PageHero';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import NprmClient from '@/components/nprm/NprmClient';
import { loadNprmPageData } from '@/lib/nprm/fetch';
import { NPRM_TABS, type NprmTabId } from '@/lib/nprm/tabs';
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

function tabLabel(tab: NprmTabId): string {
  return NPRM_TABS.find((t) => t.id === tab)?.label || 'Overview';
}

export default async function NprmShell({ tab }: { tab: NprmTabId }) {
  const data = await loadNprmPageData();
  const current = tabLabel(tab);

  return (
    <div className="nprm-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <nav
        aria-label="Breadcrumb"
        className="max-w-6xl mx-auto px-4 pt-4 text-xs sm:text-sm text-neutral/70"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-secondary underline-offset-2 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden className="opacity-50">
            /
          </li>
          <li>
            <Link href="/nprm" className="hover:text-secondary underline-offset-2 hover:underline">
              NPRM
            </Link>
          </li>
          {tab !== 'overview' ? (
            <>
              <li aria-hidden className="opacity-50">
                /
              </li>
              <li className="font-semibold text-primary" aria-current="page">
                {current}
              </li>
            </>
          ) : (
            <li className="sr-only" aria-current="page">
              Overview
            </li>
          )}
        </ol>
      </nav>
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
              Act of 2022. Comments close Aug 31, 2026 at 11:59pm ET.
            </p>
            <p>
              Last updated: {NPRM_LAST_UPDATED} ·{' '}
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
