import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Analysis - USCIS data for EB-5 investors | EB5 Base',
  description:
    'Interactive views of public USCIS datasets for EB-5 and other employment-based investors. Start with the I-485 pending inventory by category, country, and priority date.',
  alternates: { canonical: 'https://eb5base.com/analysis' },
  openGraph: {
    title: 'Analysis - USCIS data for EB-5 investors',
    description:
      'Interactive views of public USCIS datasets: I-485 pending inventory by category, country, and priority date.',
    url: 'https://eb5base.com/analysis',
  },
};

const DATASETS = [
  {
    href: '/analysis/i485',
    title: 'I-485 Pending Inventory',
    status: 'Live',
    live: true,
    body: 'Monthly USCIS snapshots of pending employment-based adjustment-of-status applications, by preference category (including EB-5 set-asides), country of chargeability, and priority date. February 2024 to present.',
    cta: 'Explore the inventory',
  },
  {
    href: null,
    title: 'I-526 / I-526E Filings',
    status: 'Planned',
    live: false,
    body: 'EB-5 petition receipts and processing data by TEA category and country, from USCIS quarterly reports.',
    cta: null,
  },
];

export default function AnalysisPage() {
  return (
    <div>
      <PageHero
        eyebrow="Analysis"
        title="USCIS data, made explorable"
        subtitle="Interactive views of public USCIS datasets that matter to EB-5 and other employment-based investors. Every chart links back to the official source file so you can verify or download the raw data."
      />

      <section className="max-w-4xl mx-auto px-4 py-10 space-y-5">
        {DATASETS.map((d) => (
          <article
            key={d.title}
            className="rounded-xl border-2 border-base-300 bg-base-100 p-5 shadow-sm"
          >
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-primary">{d.title}</h2>
              <span
                className={`badge badge-sm rounded-full font-semibold ${
                  d.live
                    ? 'badge-secondary text-secondary-content'
                    : 'border-rose/30 bg-rose/15 text-rose'
                }`}
              >
                {d.status}
              </span>
            </div>
            <p className="text-sm text-neutral/85 leading-relaxed mt-2">{d.body}</p>
            {d.href && d.cta && (
              <Link
                href={d.href}
                className="btn btn-sm btn-primary text-primary-content rounded-full mt-4"
              >
                {d.cta}
              </Link>
            )}
          </article>
        ))}

        <p className="text-xs text-neutral/70 leading-relaxed">
          Data comes from reports published by USCIS on its{' '}
          <a
            href="https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            Immigration and Citizenship Data
          </a>{' '}
          page. EB5 Base restructures it for exploration but does not alter the numbers. This is
          information only, not legal or financial advice.
        </p>
      </section>
    </div>
  );
}
