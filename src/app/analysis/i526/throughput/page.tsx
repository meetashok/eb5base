import type { Metadata } from 'next';
import I526ExplorerPage from '@/components/analysis/I526ExplorerPage';

export const metadata: Metadata = {
  title: 'I-526 throughput & processing times - USCIS EB-5 data | EB5 Base',
  description:
    'EB-5 family quarterly throughput: approvals, denials, completions, pending inventory, and median processing months for I-526 legacy, I-526 standalone, I-526E, I-829, and I-956 forms.',
  alternates: { canonical: 'https://eb5base.com/analysis/i526/throughput' },
  openGraph: {
    title: 'I-526 throughput & processing',
    description:
      'Service-wide adjudications, pending inventory, and median processing months for the EB-5 family.',
    url: 'https://eb5base.com/analysis/i526/throughput',
  },
};

export const dynamic = 'force-dynamic';

export default function I526ThroughputRoute() {
  return <I526ExplorerPage view="throughput" />;
}
