import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Community FAQ and reference links for EB-5 investors, including EB-5 and I-829 FAQ documents.',
};

const RESOURCES = [
  {
    title: 'EB-5 FAQs',
    href: 'https://bit.ly/EB5faqs',
    short: 'bit.ly/EB5faqs',
    body: 'Frequently asked questions about the EB-5 immigrant investor program.',
  },
  {
    title: 'I-829 FAQs',
    href: 'https://bit.ly/829info',
    short: 'bit.ly/829info',
    body: 'Frequently asked questions about the I-829 petition to remove conditions.',
  },
] as const;

export default function ResourcesPage() {
  return (
    <div>
      <PageHero
        eyebrow={<span>Resources</span>}
        title="Reference links for EB-5 investors"
        subtitle={
          <p>
            Community-curated FAQ documents and related materials. These are third-party resources —
            not legal advice.
          </p>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-3">
        <ul className="divide-y divide-base-300 border-y border-base-300">
          {RESOURCES.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-5 transition-colors hover:bg-base-200/40 -mx-2 px-2 rounded-lg"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-bold text-primary group-hover:text-accent transition-colors">
                    {item.title}
                  </p>
                  <p className="text-sm text-neutral/70 leading-relaxed">{item.body}</p>
                </div>
                <span className="text-sm font-medium text-secondary shrink-0 sm:pl-6">
                  {item.short}
                  <span aria-hidden className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
