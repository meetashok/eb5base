import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VisaBulletinExplorerPage from '@/components/analysis/VisaBulletinExplorerPage';
import { fetchVisaBulletinShare } from '@/lib/analysis/visaBulletinShareStore';
import {
  sharePayloadToSearchRecord,
  shareViewTitle,
  shortShareUrl,
} from '@/lib/analysis/visaBulletinShareParams';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const share = await fetchVisaBulletinShare(id);
  if (!share) return { title: 'Shared Visa Bulletin view | EB5 Base' };
  const title = shareViewTitle();
  const url = shortShareUrl(share.id);
  return {
    title: `${title} | EB5 Base`,
    alternates: { canonical: url },
    openGraph: { title, url },
    twitter: { card: 'summary_large_image', title },
  };
}

export const dynamic = 'force-dynamic';

export default async function VisaBulletinSharedPage({ params }: Props) {
  const { id } = await params;
  const share = await fetchVisaBulletinShare(id);
  if (!share) notFound();
  return <VisaBulletinExplorerPage searchParams={sharePayloadToSearchRecord(share.payload)} />;
}
