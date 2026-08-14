import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Community-built EB-5 FAQs and investor communities, including Investor Network Collective.',
  alternates: { canonical: 'https://eb5base.com/resources' },
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
    <ul className="rounded-lg border border-base-300 divide-y divide-base-300 overflow-hidden bg-base-200/30">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-1 px-3 py-3 sm:px-3.5 transition-colors hover:bg-base-100"
          >
            <div className="min-w-0 space-y-0.5">
              <h3 className="text-sm font-semibold text-primary leading-snug group-hover:text-secondary transition-colors">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                {item.body}
              </p>
            </div>
            <span className="inline-flex items-center text-xs font-semibold text-secondary">
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

function ResourceSection({
  eyebrow,
  title,
  description,
  items,
  headingId,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: ResourceLink[];
  headingId: string;
}) {
  return (
    <section
      className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft space-y-3"
      aria-labelledby={headingId}
    >
      <header className="space-y-1">
        <p className="page-hero-eyebrow mb-0">{eyebrow}</p>
        <h2
          id={headingId}
          className="text-base sm:text-lg font-bold text-primary leading-snug tracking-tight"
        >
          {title}
        </h2>
        <p className="text-sm text-neutral leading-relaxed">{description}</p>
      </header>
      <ResourceList items={items} />
    </section>
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

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10 space-y-5 sm:space-y-6">
        <ResourceSection
          eyebrow="FAQs"
          title="Community-built FAQs"
          description="Shared FAQ documents maintained by investors in the community."
          items={COMMUNITY_FAQS}
          headingId="community-faqs-heading"
        />
        <ResourceSection
          eyebrow="Communities"
          title="Investor communities"
          description="Peer spaces where EB-5 investors compare notes and timelines."
          items={INVESTOR_COMMUNITIES}
          headingId="investor-communities-heading"
        />
      </div>
    </div>
  );
}
