import Link from 'next/link';
import { DISCLAIMER } from '@/lib/constants';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'About',
};

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
    body: 'Select your regional center and confirm you represent it. We review requests within 24–48 hours.',
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
        subtitle="A community directory for EB-5 investors and regional centers to find projects, confirm subscription status, and share what they know."
      />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <section className="rounded-2xl border-2 border-secondary/20 shadow-soft p-6 md:p-10 space-y-6 bg-[linear-gradient(135deg,rgba(45,90,71,0.07)_0%,#faf7f2_58%)]">
          <div>
            <p className="text-xs uppercase tracking-widest text-secondary font-semibold mb-2">
              The challenge
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Why this exists</h2>
          </div>

          <p className="text-neutral/80 leading-relaxed text-base md:text-lg max-w-3xl">
            When someone is ready to invest in EB-5, there is a general lack of reliable public
            information. Investors often cannot tell which projects are open for subscription,
            which have I-956F approval, or what others in the community have learned — and there is
            no single place to search for answers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="rounded-xl border border-base-300/60 bg-base-100/80 p-5 space-y-3">
              <h3 className="font-bold text-primary">What investors rely on today</h3>
              <ul className="space-y-2.5 text-sm text-neutral/80">
                <PainItem>Word-of-mouth from friends, attorneys, and agents</PainItem>
                <PainItem>Community groups where tips are shared informally</PainItem>
                <PainItem>
                  Information that is transient, non-searchable, and hard to verify
                </PainItem>
              </ul>
            </div>

            <div className="rounded-xl border border-secondary/25 bg-secondary/[0.06] p-5 space-y-3">
              <h3 className="font-bold text-primary">How EB5 Base helps</h3>
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
            EB5 Base brings scattered, word-of-mouth knowledge into a shared directory — so
            investors can find projects, see what the community knows, and keep listings current
            together.
          </p>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-primary mb-2">Who it&apos;s for</h2>
            <p className="text-neutral/70 text-sm leading-relaxed max-w-2xl">
              EB5 Base serves two kinds of participants in the EB-5 community: investors
              researching opportunities and regional center representatives keeping listings
              accurate.
            </p>
          </div>

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

        <section className="card-elevated p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-primary mb-1">How it works for investors</h2>
              <p className="text-sm text-neutral/60">
                No account required to browse. Sign in when you want to confirm status or contribute.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link href="/login" className="btn btn-accent text-accent-content btn-sm rounded-full shadow-soft">
                Sign in as investor
              </Link>
              <Link href="/projects" className="btn btn-ghost btn-sm rounded-full">
                Browse projects
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INVESTOR_STEPS.map((step, i) => (
              <div key={step.title} className="step-card p-5">
                <span className="inline-flex w-8 h-8 rounded-full bg-accent text-accent-content text-sm font-bold items-center justify-center mb-3 shadow-soft">
                  {i + 1}
                </span>
                <h3 className="font-bold text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-neutral/70 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-elevated p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-primary mb-1">How it works for RC representatives</h2>
              <p className="text-sm text-neutral/60">
                Keep your regional center&apos;s listings accurate. Verified representatives can edit
                projects without waiting for admin review.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link href="/login" className="btn btn-secondary btn-sm rounded-full">
                Sign in as RC representative
              </Link>
              <Link href="/rc" className="btn btn-ghost btn-sm rounded-full">
                Browse regional centers
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RC_REP_STEPS.map((step, i) => (
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

        <section className="card-elevated p-6 md:p-8">
          <h2 className="text-xl font-bold text-primary mb-4">Your data is safe</h2>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="card-elevated p-6 md:p-8 space-y-3">
            <h2 className="text-xl font-bold text-primary">Open to the community</h2>
            <p className="text-neutral/80 leading-relaxed">
              EB5 Base is built for everyone in the EB-5 ecosystem. Browse, confirm status, add
              projects, and use representative tools whether you are researching opportunities or
              keeping your regional center&apos;s listings current.
            </p>
          </section>

          <section className="card-elevated p-6 md:p-8 space-y-3 panel-copper">
            <h2 className="text-xl font-bold text-primary">Who&apos;s behind this</h2>
            <p className="text-neutral/80 leading-relaxed">
              Ashok Kumar, founder. EB-5 investor and data scientist based in the Seattle area.
              Built the directory because the information investors need was too scattered.
            </p>
            <a
              href="https://www.linkedin.com/in/ashokkumar42/"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-secondary text-sm font-medium"
            >
              LinkedIn profile →
            </a>
          </section>
        </div>

        <section className="card-elevated p-6 md:p-8 text-center">
          <h2 className="text-xl font-bold text-primary mb-2">Questions or feedback?</h2>
          <p className="text-neutral/70 mb-5 text-sm">
            Corrections, project suggestions, or general questions. We read every message.
          </p>
          <a href="mailto:hello@eb5base.com" className="btn btn-primary rounded-full">
            hello@eb5base.com
          </a>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold text-primary">Legal</h2>
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
