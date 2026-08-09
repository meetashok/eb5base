import Link from 'next/link';
import { DISCLAIMER } from '@/lib/constants';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'About',
  description:
    'About EB5 Base: information tools for the EB-5 investor community. Not legal advice.',
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
        subtitle="Information tools for the EB-5 community. We are in public beta. Your feedback helps us improve (feedback@eb5base.com)."
      />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <section className="rounded-2xl border-2 border-secondary/20 shadow-soft p-6 md:p-10 space-y-6 bg-[linear-gradient(135deg,rgba(45,90,71,0.07)_0%,#faf7f2_58%)]">
          <SectionHeading
            eyebrow="The challenge"
            title="Why this exists"
            titleClassName="text-2xl md:text-3xl"
          />

          <p className="text-neutral/80 leading-relaxed text-base md:text-lg max-w-3xl">
            EB-5 is complex, time-sensitive, and full of official source documents that are hard
            to browse. Investors often depend on word-of-mouth, scattered community tips, and
            dense government pages. EB5 Base exists to turn that into clearer, practical
            information for the community.
          </p>

          <ul className="space-y-2.5 text-sm text-neutral/80 max-w-3xl">
            <CheckItem>
              Plain-language explainers of proposed rules and program changes, with citations back
              to official sources
            </CheckItem>
            <CheckItem>
              Tools that help investors follow case status and understand what is happening in
              their cohort (Tracker coming soon)
            </CheckItem>
            <CheckItem>
              Community-minded resources that stay free to read, without paywalled basics
            </CheckItem>
          </ul>

          <p className="text-sm text-neutral/70 leading-relaxed max-w-3xl border-t border-base-300/50 pt-5">
            We do not replace your attorney, accountant, or regional center. We help you get
            oriented so conversations with professionals start from better context.
          </p>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-4">
          <SectionHeading
            eyebrow="Audience"
            title="Who it's for"
            subtitle="EB5 Base is built mainly for potential and existing EB-5 investors."
          />
          <ul className="space-y-2.5 text-sm text-neutral/80">
            <CheckItem>
              Potential investors researching how the program works and what current policy
              proposals mean
            </CheckItem>
            <CheckItem>
              Existing investors following petitions, green-card conditions, and related USCIS
              updates
            </CheckItem>
            <CheckItem>
              Family members and advisors who need a clear public reference point (not a
              substitute for counsel)
            </CheckItem>
          </ul>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <section className="card-elevated p-6 md:p-8 space-y-4 h-full">
            <SectionHeading eyebrow="Access" title="Open to the community" titleClassName="text-xl" />
            <div className="space-y-3 text-neutral/80 leading-relaxed">
              <p>
                Core information on EB5 Base is free to read. There is no paywall for the NPRM
                guide, and the case tracker will be built for the same community standard.
              </p>
              <p>
                Feedback from investors shapes what we build next. If something is unclear or
                missing, tell us at{' '}
                <a href="mailto:feedback@eb5base.com" className="link link-secondary">
                  feedback@eb5base.com
                </a>
                .
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
                Ashok Kumar is an EB-5 investor and data scientist based in the Seattle area. He
                has lived in the U.S. since 2015 and received conditional permanent residency
                through the EB-5 program in 2025.
              </p>
              <p>
                EB-5 community groups were an invaluable resource throughout his immigration
                journey. He built EB5 Base to turn hard-won, scattered knowledge into clearer
                public information other investors can use.
              </p>
            </div>
          </section>
        </div>

        <section className="card-elevated p-6 md:p-8 text-center">
          <SectionHeading
            eyebrow="Get in touch"
            title="Questions or feedback?"
            subtitle="Corrections, product ideas, or general questions. We read every message."
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
