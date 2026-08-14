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
  description: string;
  /** Small outline pills shown next to the title for quick scanning. */
  tags: string[];
  /** Used in the link's aria-label: "opens {destination} in a new tab". */
  destination: string;
};

const COMMUNITY_FAQS: ResourceLink[] = [
  {
    title: 'EB-5 FAQs',
    href: 'https://bit.ly/EB5faqs',
    short: 'bit.ly/EB5faqs',
    description: 'Common questions about the EB-5 immigrant investor program.',
    tags: ['Google Doc'],
    destination: 'a Google Doc',
  },
  {
    title: 'I-829 FAQs',
    href: 'https://bit.ly/829info',
    short: 'bit.ly/829info',
    description: 'Common questions about the I-829 petition to remove conditions.',
    tags: ['Google Doc'],
    destination: 'a Google Doc',
  },
];

const INVESTOR_COMMUNITIES: ResourceLink[] = [
  {
    title: 'Investor Network Collective',
    href: 'https://investornetworkcollective.org/',
    short: 'investornetworkcollective.org',
    description:
      'Peer-driven EB-5 nonprofit. Discord forums, anonymized timeline tracking, no sales pressure.',
    tags: ['Nonprofit', 'Discord'],
    destination: 'the Investor Network Collective website',
  },
  {
    title: 'EB-5 Visa Group (Telegram)',
    href: 'https://t.me/EB5VisaGroup',
    short: 't.me/EB5VisaGroup',
    description: 'Public Telegram group where investors ask questions and compare notes.',
    tags: ['Public group'],
    destination: 'the EB-5 Visa Group on Telegram',
  },
];

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-3 w-3 shrink-0"
    >
      <path
        d="M11 3h6v6M17 3l-8 8M15 12v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded border border-base-300 bg-base-200/70 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-neutral/60">
      {label}
    </span>
  );
}

function ResourceItem({ item }: { item: ResourceLink }) {
  return (
    <li className="rounded-lg border border-base-300/70 bg-base-200/40 px-3.5 py-2.5 sm:px-4">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold leading-snug text-primary">{item.title}</h3>
            {item.tags.map((tag) => (
              <Pill key={tag} label={tag} />
            ))}
          </div>
          <p className="max-w-prose text-[13px] leading-snug text-neutral/70">{item.description}</p>
        </div>

        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${item.title}: opens ${item.destination} in a new tab`}
          className="group inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-3 text-xs font-semibold text-secondary transition-colors hover:text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:min-h-0 sm:w-auto sm:shrink-0 sm:justify-start sm:py-1.5"
        >
          <span className="truncate">{item.short}</span>
          <ExternalLinkIcon />
        </a>
      </div>
    </li>
  );
}

function ResourceSection({
  eyebrow,
  title,
  items,
  headingId,
}: {
  eyebrow: string;
  title: string;
  items: ResourceLink[];
  headingId: string;
}) {
  return (
    <section
      className="rounded-xl border-2 border-base-300 bg-base-100 p-4 shadow-soft sm:p-5"
      aria-labelledby={headingId}
    >
      <header className="mb-2.5">
        <p className="page-hero-eyebrow mb-0 tracking-widest">{eyebrow}</p>
        <h2
          id={headingId}
          className="text-base font-semibold leading-tight tracking-tight text-primary sm:text-lg"
        >
          {title}
        </h2>
      </header>
      <ul className="space-y-2">
        {items.map((item) => (
          <ResourceItem key={item.href} item={item} />
        ))}
      </ul>
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

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-4">
        <ResourceSection
          eyebrow="FAQs"
          title="Community-built FAQs"
          items={COMMUNITY_FAQS}
          headingId="community-faqs-heading"
        />
        <ResourceSection
          eyebrow="Communities"
          title="Investor communities"
          items={INVESTOR_COMMUNITIES}
          headingId="investor-communities-heading"
        />
      </div>
    </div>
  );
}
