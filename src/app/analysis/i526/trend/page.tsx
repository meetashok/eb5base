import type { Metadata } from 'next';
import I526ExplorerPage from '@/components/analysis/I526ExplorerPage';

export const metadata: Metadata = {
  title: 'I-526 filings trend - USCIS EB-5 petition data | EB5 Base',
  description:
    'Trend view of EB-5 I-526 / I-526E petition receipts by form type, country of birth, and TEA set-aside category, across receipt months.',
  alternates: { canonical: 'https://eb5base.com/analysis/i526/trend' },
  openGraph: {
    title: 'I-526 filings trend',
    description:
      'EB-5 petition receipts over time sliced by form, country, and TEA category. FY2026 Q1-Q2.',
    url: 'https://eb5base.com/analysis/i526/trend',
  },
};

export const dynamic = 'force-dynamic';

export default function I526TrendRoute() {
  return <I526ExplorerPage view="trend" />;
}
