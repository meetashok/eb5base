import Link from 'next/link';
import { DISCLAIMER } from '@/lib/constants';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'About',
};

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  eyebrowClassName = 'text-secondary',
  titleClassName = 'text-xl md:text-2xl',
  className = '',
  titleAction,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  className?: string;
  titleAction?: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={className}>
      <p
        className={`text-xs uppercase tracking-[0.22em] font-semibold mb-2 ${eyebrowClassName} ${
          centered ? 'text-center' : ''
        }`}
      >
        {eyebrow}
      </p>
      <div className={`flex items-center gap-2 ${centered ? 'justify-center' : ''}`}>
        <h2 className={`font-bold text-primary ${titleClassName}`}>{title}</h2>
        {titleAction}
      </div>
      {subtitle && (
        <p
          className={`text-sm text-neutral/60 mt-2 leading-relaxed max-w-2xl ${
            centered ? 'mx-auto' : ''
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PainItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="w-5 h-5 shrink-0 mt-0.5 rounded-full bg-neutral/10 text-neutral/50 text-xs font-bold flex items-center justify-center">
        ·
      </span>
      <span>{children}</span>
    </li>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <svg
        className="w-5 h-5 text-secondary shrink-0 mt-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

const INVESTOR_STEPS = [
  {
    title: 'Browse projects',
    body: 'Search by name, regional center, location, TEA designation, and status.',
  },
  {
    title: 'Confirm status',
    body: 'Share whether a project is still open so the community stays current.',
  },
  {
    title: 'Contribute',
    body: 'Add projects and update details so fellow investors benefit.',
  },
];

const RC_REP_STEPS = [
  {
    title: 'Sign in',
    body: 'Create an account with Google or email to access representative tools.',
  },
  {
    title: 'Verify your RC',
    body: 'Select your regional center and confirm you represent it. We review requests within 24 to 48 hours.',
  },
  {
    title: 'Claim & edit projects',
    body: 'Take ownership of your RC\u2019s project listings and keep details accurate. Verified edits go live right away.',
  },
];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="Community-built · Investor-led"
        title={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            About <BrandWordmark variant="on-light" className="text-[0.88em] sm:text-[0.95em]" />
          </span>
        }
        subtitle="A community directory for EB-5 investors and regional centers. We're in public beta. Your feedback helps us improve (feedback@eb5base.com)."
      />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <section className="rounded-2xl border-2 border-secondary/20 shadow-soft p-6 md:p-10 space-y-6 bg-[linear-gradient(135deg,rgba(45,90,71,0.07)_0%,#faf7f2_58%)]">
          <SectionHeading
            eyebrow="The challenge"
            title="Why this exists"
            titleClassName="text-2xl md:text-3xl"
          />

          <p className="text-neutral/80 leading-relaxed text-base md:text-lg max-w-3xl">
            When someone is ready to invest in EB-5, there is a general lack of reliable public
            information. Investors often cannot tell which projects are open for subscription,
            which have I-956F approval, or what others in the community have learned. There is no
            single place to search for answers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="rounded-xl border border-base-300/60 bg-base-100/80 p-5 space-y-3">
              <SectionHeading
                eyebrow="Today"
                title="What investors rely on"
                titleClassName="text-base"
              />
              <ul className="space-y-2.5 text-sm text-neutral/80">
                <PainItem>Word-of-mouth from friends, attorneys, and agents</PainItem>
                <PainItem>Community groups where tips are shared informally</PainItem>
                <PainItem>
                  Information that is transient, non-searchable, and hard to verify
                </PainItem>
              </ul>
            </div>

            <div className="rounded-xl border border-secondary/25 bg-secondary/[0.06] p-5 space-y-3">
              <SectionHeading
                eyebrow="Our approach"
                title="How EB5 Base helps"
                titleClassName="text-base"
              />
              <ul className="space-y-2.5 text-sm text-neutral/80">
                <CheckItem>A searchable directory of EB-5 projects in one place</CheckItem>
                <CheckItem>
                  Community confirmations on whether subscriptions are still open
                </CheckItem>
                <CheckItem>
                  Persistent listings anyone can browse, filter, and contribute to
                </CheckItem>
              </ul>
            </div>
          </div>

          <p className="text-sm text-neutral/70 leading-relaxed max-w-3xl border-t border-base-300/50 pt-5">
            EB5 Base brings scattered, word-of-mouth knowledge into a shared directory so investors
            can find projects, see what the community knows, and keep listings current together.
          </p>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-6">
          <SectionHeading
            eyebrow="All audiences"
            title="Who it's for"
            subtitle="EB5 Base serves investors researching opportunities and regional center representatives keeping listings accurate."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="step-card p-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-secondary font-semibold mb-1">
                  For investors
                </p>
                <h3 className="font-bold text-primary">Potential &amp; existing investors</h3>
                <p className="text-sm text-neutral/70 mt-2 leading-relaxed">
                  Whether you are exploring EB-5 for the first time or already in a project, use the
                  directory to find opportunities and see what the community knows.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-neutral/80">
                <CheckItem>Browse and filter projects by regional center, location, and status</CheckItem>
                <CheckItem>Confirm whether subscriptions are still open</CheckItem>
                <CheckItem>Add projects and share factual details with fellow investors</CheckItem>
              </ul>
            </div>

            <div className="step-card p-5 space-y-4 panel-copper">
              <div>
                <p className="text-xs uppercase tracking-widest text-copper font-semibold mb-1">
                  For regional centers
                </p>
                <h3 className="font-bold text-primary">RC representatives</h3>
                <p className="text-sm text-neutral/70 mt-2 leading-relaxed">
                  If you work at a regional center, sign in to verify your affiliation and manage
                  your project listings directly.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-neutral/80">
                <CheckItem>Sign in and complete your profile as an RC representative</CheckItem>
                <CheckItem>Verify that you represent your regional center</CheckItem>
                <CheckItem>Claim project listings for your RC and edit them as needed</CheckItem>
              </ul>
            </div>
          </div>
        </section>

        <section className="card-elevated p-6 md:p-8 panel-investor">
          <p className="text-xs uppercase tracking-widest text-secondary font-semibold">
            For investors
          </p>
          <h2 className="text-xl font-bold text-primary mt-1 mb-1">How it works for investors</h2>
          <p className="text-sm text-neutral/60 max-w-2xl">
            No account required to browse. Sign in when you want to confirm status or contribute.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/login" className="btn btn-secondary btn-sm rounded-full shadow-soft">
              Sign in as an investor
            </Link>
            <Link href="/projects" className="btn btn-outline btn-secondary btn-sm rounded-full">
              Browse projects
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {INVESTOR_STEPS.map((step, i) => (
              <div key={step.title} className="step-card p-5">
                <span className="inline-flex w-8 h-8 rounded-full bg-secondary text-secondary-content text-sm font-bold items-center justify-center mb-3 shadow-soft">
                  {i + 1}
                </span>
                <h3 className="font-bold text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-neutral/70 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-elevated p-6 md:p-8 panel-copper">
          <p className="text-xs uppercase tracking-widest text-copper font-semibold">
            For regional center representatives
          </p>
          <h2 className="text-xl font-bold text-primary mt-1 mb-1">How it works for RC representatives</h2>
          <p className="text-sm text-neutral/60 max-w-2xl">
            Keep your regional center&apos;s listings accurate. Verified representatives can edit
            projects without waiting for admin review.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href="/login"
              className="btn btn-sm rounded-full bg-copper text-white border-0 hover:bg-copper-dark shadow-soft"
            >
              Sign in as an RC representative
            </Link>
            <Link href="/rc" className="btn btn-outline btn-sm rounded-full border-copper/40 text-copper hover:bg-copper/10">
              Browse regional centers
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {RC_REP_STEPS.map((step, i) => (
              <div key={step.title} className="step-card p-5">
                <span className="inline-flex w-8 h-8 rounded-full bg-copper text-white text-sm font-bold items-center justify-center mb-3 shadow-soft">
                  {i + 1}
                </span>
                <h3 className="font-bold text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-neutral/70 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-4">
          <SectionHeading eyebrow="Privacy" title="Your data is safe" titleClassName="text-xl" />
          <ul className="space-y-3 text-neutral/80">
            <CheckItem>Email used only for auth, never displayed or shared</CheckItem>
            <CheckItem>No tracking cookies, no ads, no third-party data sharing</CheckItem>
            <CheckItem>
              Privacy-focused, anonymized analytics via{' '}
              <a
                href="https://www.goatcounter.com/help/privacy"
                className="link link-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                GoatCounter
              </a>
            </CheckItem>
          </ul>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <section className="card-elevated p-6 md:p-8 space-y-4 h-full">
            <SectionHeading eyebrow="Access" title="Open to the community" titleClassName="text-xl" />
            <div className="space-y-3 text-neutral/80 leading-relaxed">
              <p>
                EB5 Base is built for everyone in the EB-5 ecosystem. There is no paywall to
                browse, and anyone can help keep the directory useful.
              </p>
              <p>
                Investors can search projects and confirm subscription status without signing in.
                Regional center representatives can verify their affiliation and keep listings
                current. The directory is free for everyone participating in EB-5.
              </p>
            </div>
          </section>

          <section className="card-elevated p-6 md:p-8 space-y-4 panel-copper h-full">
            <SectionHeading
              eyebrow="The founder"
              title="Who's behind this"
              eyebrowClassName="text-copper"
              titleClassName="text-xl"
              titleAction={
                <a
                  href="https://www.linkedin.com/in/ashokkumar42/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ashok Kumar on LinkedIn"
                  className="text-copper hover:text-copper-dark transition-colors shrink-0"
                >
                  <LinkedInIcon />
                </a>
              }
            />
            <div className="space-y-3 text-neutral/80 leading-relaxed">
              <p>
                Ashok Kumar is an EB-5 investor and data scientist based in the Seattle area. He has
                lived in the U.S. since 2015 and received conditional permanent residency through
                the EB-5 program in 2025.
              </p>
              <p>
                EB-5 community groups were an invaluable resource throughout his immigration
                journey, and he remains an active contributor. He built EB5 Base because
                the lack of reliable project information is a problem he saw firsthand: tips passed
                through word-of-mouth, scattered across groups, and gone as soon as the
                conversation moves on.
              </p>
            </div>
          </section>
        </div>

        <section className="card-elevated p-6 md:p-8 text-center">
          <SectionHeading
            eyebrow="Get in touch"
            title="Questions or feedback?"
            subtitle="Corrections, project suggestions, or general questions. We read every message."
            titleClassName="text-xl"
            className="mx-auto max-w-lg"
            centered
          />
          <a href="mailto:hello@eb5base.com" className="btn btn-primary rounded-full mt-5">
            hello@eb5base.com
          </a>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-4">
          <SectionHeading eyebrow="Disclaimer" title="Legal" titleClassName="text-xl" />
          <p className="text-sm text-neutral/80 leading-relaxed">{DISCLAIMER}</p>
          <p className="text-sm text-neutral/80">
            Read our full{' '}
            <Link href="/terms" className="link link-secondary">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="link link-secondary">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
