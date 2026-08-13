'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHero from '@/components/PageHero';

export default function I526SourceDataRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/analysis/data');
  }, [router]);

  return (
    <div>
      <PageHero
        eyebrow={
          <span>
            <Link href="/analysis" className="hover:underline">
              Analysis
            </Link>{' '}
            / Source data
          </span>
        }
        title="Moving to the combined source data page"
        subtitle="All USCIS source downloads now live on a single page. Redirecting there now…"
      />
      <section className="max-w-2xl mx-auto px-4 py-10 text-center space-y-4">
        <p className="text-sm text-neutral">
          If you are not redirected automatically,{' '}
          <Link
            href="/analysis/data"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            open the combined source data page here
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
