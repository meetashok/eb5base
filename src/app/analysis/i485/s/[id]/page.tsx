import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import I485Explorer from '@/components/analysis/I485Explorer';
import { loadInitialInventory } from '@/components/analysis/I485ExplorerPage';
import {
  shareFilterSummary,
  shareViewTitle,
  shortShareUrl,
} from '@/lib/analysis/i485ShareParams';
import { fetchI485Share } from '@/lib/analysis/i485ShareStore';
import { I485_DEFAULT_PATH } from '@/lib/analysis/i485Routes';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const share = await fetchI485Share(id);
  if (!share) {
    return { title: 'Shared I-485 chart | EB5 Base' };
  }
  const title = shareViewTitle(share.payload.view);
  const description = shareFilterSummary(share.payload);
  const url = shortShareUrl(share.id);
  return {
    title: `${title} | EB5 Base`,
    description,
    alternates: { canonical: url },
    icons: {
      icon: [
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/logo.png', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      title,
      description,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function I485SharedChartPage({ params }: Props) {
  const { id } = await params;
  const share = await fetchI485Share(id);
  if (!share) notFound();

  const initial = await loadInitialInventory();
  const title = shareViewTitle(share.payload.view);

  return (
    <div>
      <PageHero
        eyebrow={
          <span>
            <Link href="/analysis" className="hover:underline">
              Analysis
            </Link>{' '}
            /{' '}
            <Link href={I485_DEFAULT_PATH} className="hover:underline">
              I-485 Pending Inventory
            </Link>{' '}
            / Shared
          </span>
        }
        title={title}
        subtitle={shareFilterSummary(share.payload)}
      />

      <I485Explorer
        initialView={share.payload.view}
        initialSharePayload={share.payload}
        initialReleases={initial.releases}
        initialReleaseId={initial.releaseId}
        initialSnapshotCells={
          share.payload.view === 'snapshot' ? initial.cells : null
        }
        initialError={initial.error}
      />
    </div>
  );
}
