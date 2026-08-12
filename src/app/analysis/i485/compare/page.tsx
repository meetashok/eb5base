import type { Metadata } from 'next';
import I485ExplorerPage from '@/components/analysis/I485ExplorerPage';

export const metadata: Metadata = {
  title: 'Compare I-485 snapshots - USCIS employment-based data | EB5 Base',
  description:
    'Compare two USCIS snapshots of pending employment-based I-485 applications and see change by priority date, category, and country.',
  alternates: { canonical: 'https://eb5base.com/analysis/i485/compare' },
  openGraph: {
    title: 'I-485 Pending Inventory — Compare snapshots',
    description:
      'Diff two USCIS pending I-485 inventory snapshots by priority date.',
    url: 'https://eb5base.com/analysis/i485/compare',
  },
};

export const dynamic = 'force-dynamic';

export default function I485CompareRoute() {
  return <I485ExplorerPage view="compare" />;
}
