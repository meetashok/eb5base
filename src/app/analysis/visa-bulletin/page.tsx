import type { Metadata } from 'next';
import VisaBulletinExplorerPage from '@/components/analysis/VisaBulletinExplorerPage';

export const metadata: Metadata = {
  title: 'EB-5 Visa Bulletin over time | EB5 Base',
  description:
    'The State Department Visa Bulletin for EB-5: monthly Final Action Dates and Dates for Filing over time, split into Unreserved and the RIA set-asides (Rural, High Unemployment, Infrastructure), by country of chargeability.',
  alternates: { canonical: 'https://eb5base.com/analysis/visa-bulletin' },
  openGraph: {
    title: 'EB-5 Visa Bulletin over time',
    description:
      'Monthly Visa Bulletin cut-off dates for EB-5, split by Unreserved and set-aside categories, by country.',
    url: 'https://eb5base.com/analysis/visa-bulletin',
  },
};

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return <VisaBulletinExplorerPage searchParams={searchParams} />;
}
