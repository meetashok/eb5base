import { Suspense } from 'react';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import NprmClient from '@/components/nprm/NprmClient';
import { loadNprmPageData } from '@/lib/nprm/fetch';
import type { NprmTabId } from '@/lib/nprm/tabs';
import { NPRM_LAST_UPDATED } from '@/lib/nprm/utils';

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
