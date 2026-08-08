import { notFound, redirect } from 'next/navigation';
import { isNprmTabId } from '@/lib/nprm/tabs';
import NprmShell from '../NprmShell';

// Request-time so Hatch feed publishes show up on every page load.
export const dynamic = 'force-dynamic';

export default function NprmTabPage({
  params,
}: {
  params: { tab: string };
}) {
  const { tab } = params;
  if (tab === 'overview') {
    redirect('/nprm');
  }
  if (!isNprmTabId(tab)) {
    notFound();
  }
  return <NprmShell tab={tab} />;
}
