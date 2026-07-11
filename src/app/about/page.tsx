import Link from 'next/link';
import { DISCLAIMER } from '@/lib/constants';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'About',
};

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
    body: 'Create a free account with Google or email to access representative tools.',
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
        subtitle="A free directory helping EB-5 investors find projects, confirm subscription status, and share what they know."
      />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <section className="card-elevated p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold text-primary">Why this exists</h2>
          <p className="text-neutral/80 leading-relaxed">
            The EB-5 community deserves better access to information. Finding which projects are
            open, which have I-956F approval, or what other investors think often means digging
            through WhatsApp groups and scattered websites. EB5 Base brings this together in one
            place.
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
            <CheckItem>Country of birth optional and never shown publicly</CheckItem>
            <CheckItem>No tracking cookies, no ads, no third-party data sharing</CheckItem>
            <CheckItem>Analytics are privacy-focused and anonymized (GoatCounter)</CheckItem>
          </ul>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="card-elevated p-6 md:p-8 space-y-3">
            <h2 className="text-xl font-bold text-primary">Free for investors</h2>
            <p className="text-neutral/80 leading-relaxed">
              EB5 Base is free to use. Browse, confirm, add projects, and access all features at no
              cost.
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
