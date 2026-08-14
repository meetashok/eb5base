import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import I526Explorer from '@/components/analysis/I526Explorer';
import {
  loadInitialI526,
} from '@/components/analysis/I526ExplorerPage';
import {
  shareViewTitle,
  shortShareUrl,
  type I526SharePayload,
} from '@/lib/analysis/i526ShareParams';
import { fetchI526Share } from '@/lib/analysis/i526ShareStore';
import { I526_DEFAULT_PATH } from '@/lib/analysis/i526Routes';
import AnalysisDatasetCrumb from '@/components/analysis/AnalysisDatasetCrumb';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const share = await fetchI526Share(id);
  if (!share) {
    return { title: 'Shared I-526 chart | EB5 Base' };
  }
  const title = shareViewTitle(share.payload.view);
  const url = shortShareUrl(share.id);
  return {
    title: `${title} | EB5 Base`,
    description: title,
    alternates: { canonical: url },
    icons: {
      icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      title,
      description: title,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: title,
    },
  };
}

export const dynamic = 'force-dynamic';

function summaryForPayload(p: I526SharePayload): string {
  const parts: string[] = [];
  if (p.view === 'trend') parts.push('EB5 filings');
  else if (p.view === 'throughput') parts.push('Throughput & processing');
  else parts.push('Source data');
  if (p.countries.length > 0) parts.push(p.countries.join(', '));
  return parts.join(' · ');
}

export default async function I526SharedChartPage({ params }: Props) {
  const { id } = await params;
  const share = await fetchI526Share(id);
  if (!share) notFound();

  const initial = await loadInitialI526();
  const title = shareViewTitle(share.payload.view);
  const p = share.payload;

  return (
    <div>
      <PageHero
        eyebrow={
          <span>
            <Link href="/analysis" className="hover:underline">
              Analysis
            </Link>{' '}
            /{' '}
            <Link href={I526_DEFAULT_PATH} className="hover:underline">
              <AnalysisDatasetCrumb current="i526" />
            </Link>{' '}
            / Shared
          </span>
        }
        title={title}
        subtitle={summaryForPayload(p)}
      />

      <I526Explorer
        initialView={p.view}
        initialSharePayload={p}
        initialReleases={initial.releases}
        initialLatestAIds={
          p.trendReleaseIds.length > 0 ? p.trendReleaseIds : initial.latestAFilingReleaseIds
        }
        initialLatestBIds={
          p.throughputBIds.length > 0 ? p.throughputBIds : initial.latestBReleaseIds
        }
        initialFilingCells={
          p.view === 'trend' ? initial.filingCells : null
        }
        initialProcessingRows={
          p.view === 'throughput' ? initial.processingRows : null
        }
        initialError={initial.error}
      />
    </div>
  );
}
