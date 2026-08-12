import type { Metadata } from 'next';
import I485ExplorerPage from '@/components/analysis/I485ExplorerPage';

export const metadata: Metadata = {
  title: 'I-485 inventory snapshot - USCIS employment-based data | EB5 Base',
  description:
    'Explore a single USCIS snapshot of pending employment-based I-485 applications by preference category, country of chargeability, and priority date.',
  alternates: { canonical: 'https://eb5base.com/analysis/i485/inventory' },
  openGraph: {
    title: 'I-485 Pending Inventory — Point in time',
    description:
      'Pending I-485 inventory for one USCIS snapshot, by category, country, and priority date.',
    url: 'https://eb5base.com/analysis/i485/inventory',
  },
};

export const dynamic = 'force-dynamic';

export default function I485InventoryRoute() {
  return <I485ExplorerPage view="snapshot" />;
}
