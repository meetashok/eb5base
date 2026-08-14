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
  /** Small outline pills shown above the title for quick scanning. */
  tags: string[];
  /** One short line under the link button (what/where it is). */
  helper: string;
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
    helper: 'Community-maintained Google Doc.',
    destination: 'a Google Doc',
  },
  {
    title: 'I-829 FAQs',
    href: 'https://bit.ly/829info',
    short: 'bit.ly/829info',
    description: 'Common questions about the I-829 petition to remove conditions.',
    tags: ['Google Doc'],
    helper: 'Community-maintained Google Doc.',
    destination: 'a Google Doc',
  },
];

const INVESTOR_COMMUNITIES: ResourceLink[] = [
  {
    title: 'Investor Network Collective',
    href: 'https://investornetworkcollective.org/',
    short: 'investornetworkcollective.org',
    description:
      'Peer-driven EB-5 community and 501(c)(3) nonprofit. Discord forums, anonymized timeline tracking, and moderated discussion without sales pressure.',
    tags: ['Nonprofit', 'Discord'],
    helper: 'Website with a Discord community.',
    destination: 'the Investor Network Collective website',
  },
  {
    title: 'EB-5 Visa Group (Telegram)',
    href: 'https://t.me/EB5VisaGroup',
    short: 't.me/EB5VisaGroup',
    description: 'Public Telegram group where investors ask questions and compare notes.',
    tags: ['Public group'],
    helper: 'Opens in Telegram.',
    destination: 'the EB-5 Visa Group on Telegram',
  },
];

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0"
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
    <span className="inline-flex items-center rounded border border-base-300 bg-base-200/70 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-neutral/60">
      {label}
    </span>
  );
}

function ResourceItem({ item }: { item: ResourceLink }) {
  return (
    <li className="rounded-lg border border-base-300/70 bg-base-200/40 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1.5">
          {item.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {item.tags.map((tag) => (
                <Pill key={tag} label={tag} />
              ))}
            </div>
          )}
          <h3 className="text-base font-semibold leading-snug text-primary">{item.title}</h3>
          <p className="max-w-prose text-sm leading-relaxed text-neutral/80">{item.description}</p>
        </div>

        <div className="w-full shrink-0 space-y-1 sm:w-auto sm:text-right">
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title}: opens ${item.destination} in a new tab`}
            className="group inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-semibold text-secondary transition-colors hover:bg-base-100 hover:text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:w-auto sm:justify-start"
          >
            <span className="truncate">{item.short}</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
            <ExternalLinkIcon />
          </a>
          <p className="text-[11px] leading-snug text-neutral/50">{item.helper}</p>
        </div>
      </div>
    </li>
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
      className="rounded-xl border-2 border-base-300 bg-base-100 p-4 shadow-soft sm:p-6"
      aria-labelledby={headingId}
    >
      <header className="mb-4 space-y-1">
        <p className="page-hero-eyebrow mb-0 tracking-widest">{eyebrow}</p>
        <h2
          id={headingId}
          className="text-xl font-semibold leading-tight tracking-tight text-primary sm:text-2xl"
        >
          {title}
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-neutral">{description}</p>
      </header>
      <ul className="space-y-3">
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
