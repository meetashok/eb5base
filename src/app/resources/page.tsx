import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Community-built EB-5 FAQs and investor communities, including Investor Network Collective.',
};

type ResourceLink = {
  title: string;
  href: string;
  short: string;
  body: string;
};

const COMMUNITY_FAQS: ResourceLink[] = [
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
];

const INVESTOR_COMMUNITIES: ResourceLink[] = [
  {
    title: 'Investor Network Collective',
    href: 'https://investornetworkcollective.org/',
    short: 'investornetworkcollective.org',
    body: 'Peer-driven EB-5 community (501(c)(3) nonprofit). Discord forums for investors and professionals, anonymized timeline tracking, and moderated discussion without sales pressure.',
  },
];

function ResourceList({ items }: { items: ResourceLink[] }) {
  return (
    <ul className="divide-y divide-base-300 border-y border-base-300">
      {items.map((item) => (
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
              <span
                aria-hidden
                className="ml-1 inline-block transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function ResourcesPage() {
  return (
    <div>
      <PageHero
        eyebrow={<span>Resources</span>}
        title="Reference links for EB-5 investors"
        subtitle={
          <p>
            Community-built FAQs and investor communities. These are third-party
            resources, not legal advice.
          </p>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <section className="space-y-3" aria-labelledby="community-faqs-heading">
          <h2
            id="community-faqs-heading"
            className="text-lg font-bold text-primary tracking-tight"
          >
            Community-built FAQs
          </h2>
          <p className="text-sm text-neutral/70 leading-relaxed">
            Shared FAQ documents maintained by investors in the community.
          </p>
          <ResourceList items={COMMUNITY_FAQS} />
        </section>

        <section
          className="space-y-3"
          aria-labelledby="investor-communities-heading"
        >
          <h2
            id="investor-communities-heading"
            className="text-lg font-bold text-primary tracking-tight"
          >
            Investor communities
          </h2>
          <p className="text-sm text-neutral/70 leading-relaxed">
            Peer spaces where EB-5 investors compare notes and timelines.
          </p>
          <ResourceList items={INVESTOR_COMMUNITIES} />
        </section>
      </div>
    </div>
  );
}
