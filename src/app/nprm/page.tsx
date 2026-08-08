import { Suspense } from 'react';
import PageHero from '@/components/PageHero';
import NprmClient from '@/components/nprm/NprmClient';
import NprmDisclaimer from '@/components/nprm/NprmDisclaimer';
import { loadNprmPageData } from '@/lib/nprm/fetch';

export const revalidate = 3600;

export default async function NprmPage() {
  const data = await loadNprmPageData();

  return (
    <div>
      <PageHero
        eyebrow="USCIS-2026-0100"
        title="EB-5 NPRM Tracker"
        subtitle="Browse real comments by theme, learn the CFR stakes, and generate a distinct prompt for your own LLM before filing on regulations.gov."
      />
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <NprmDisclaimer />
      </div>
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
