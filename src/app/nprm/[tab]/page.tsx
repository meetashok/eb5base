import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isNprmTabId } from '@/lib/nprm/tabs';
import { metadataForNprmTabParam } from '@/lib/nprm/metadata';
import NprmShell from '../NprmShell';

// Request-time so Hatch feed publishes show up on every page load.
export const dynamic = 'force-dynamic';

export function generateMetadata({
  params,
}: {
  params: { tab: string };
}): Metadata {
  return metadataForNprmTabParam(params.tab);
}

export default function NprmTabPage({
  params,
}: {
  params: { tab: string };
}) {
  const { tab } = params;
  if (tab === 'overview') {
    redirect('/nprm');
  }
  // Themes tab removed: same six topics now live on Summary.
  if (tab === 'themes' || tab === 'comment-themes') {
    redirect('/nprm/summary');
  }
  if (!isNprmTabId(tab)) {
    notFound();
  }
  return <NprmShell tab={tab} />;
}
