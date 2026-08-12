import type { Metadata } from 'next';
import I485ExplorerPage from '@/components/analysis/I485ExplorerPage';

export const metadata: Metadata = {
  title: 'I-485 priority-date cohort - USCIS employment-based data | EB5 Base',
  description:
    'Track how a priority-date cohort of pending employment-based I-485 applications has moved across monthly USCIS snapshots since February 2024.',
  alternates: { canonical: 'https://eb5base.com/analysis/i485/priority-date' },
  openGraph: {
    title: 'I-485 Pending Inventory — Priority-date cohort',
    description:
      'Follow a priority-date cohort of pending I-485s across USCIS monthly snapshots.',
    url: 'https://eb5base.com/analysis/i485/priority-date',
  },
};

export const dynamic = 'force-dynamic';

export default function I485PriorityDateRoute() {
  return <I485ExplorerPage view="cohort" />;
}
