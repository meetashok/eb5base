import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandWordmark } from '@/components/Logo';
import CaseTrackerWaitlistForm from '@/components/CaseTrackerWaitlistForm';
import HomeDeadlineCountdown from '@/components/HomeDeadlineCountdown';

export const metadata: Metadata = {
  title: 'EB5 Base: Free EB-5 Investor Library and NPRM Guide',
  description:
    'Investor-built tools for EB-5: plain-English NPRM explainer (comments due Aug 31 2026), status update builder, and forthcoming case tracker. Nothing here is legal or financial advice.',
  alternates: { canonical: 'https://eb5base.com/' },
  openGraph: {
    title: 'EB5 Base: Free EB-5 Investor Library and NPRM Guide',
    description:
      'Investor-built tools for EB-5: plain-English NPRM explainer, status update builder, and forthcoming case tracker.',
    url: 'https://eb5base.com/',
    siteName: 'EB5 Base',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EB5 Base: Free EB-5 Investor Library and NPRM Guide',
    description:
      'Investor-built tools for EB-5: plain-English NPRM explainer, status update builder, and forthcoming case tracker.',
  },
};

const TOOLS = [
  {
    href: '/nprm',
    title: 'NPRM Comment Guide',
    body: 'Plain-English explainer of the July 2026 EB-5 proposed rule, impact matrix, themes, and comment builder. Comments close Aug 31.',
    cta: 'Read explainer (5 min)',
    badge: 'Urgent - Comment deadline Aug 31',
    comingSoon: false,
    primary: true,
    variant: 'nprm' as const,
  },
  {
    href: '/status',
    title: 'Status Update',
    body: 'Draft a structured EB-5 status update from your milestones, preview it live, and share it with your community.',
    cta: 'Open Status Update',
    badge: 'Available now',
    comingSoon: false,
    primary: false,
    variant: 'status' as const,
  },
  {
    href: '/tracker',
    title: 'Case Tracker',
    body: 'Track USCIS case status for your petitions, get notified on changes, and learn from anonymized cohort insights.',
    cta: 'Preview Case Tracker',
    badge: 'Coming soon - Join waitlist',
    comingSoon: true,
    primary: false,
    variant: 'tracker' as const,
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="hero-glow border-b border-base-300/80 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 40% 50% at 90% 10%, rgba(184, 115, 51, 0.2), transparent 60%)',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center relative">
          <p className="hero-eyebrow mb-4">Community-built · Investor-led</p>
          <h1 className="text-4xl md:text-5xl font-bold hero-headline tracking-tight text-balance">
            Information tools for EB-5 investors
          </h1>
          <p className="mt-4 text-base md:text-lg text-neutral/70 max-w-2xl mx-auto leading-relaxed">
            <BrandWordmark variant="on-light" className="font-semibold" /> is a free,
            investor-built library that translates USCIS rules into plain English, tracks case
            milestones, and helps you comment on policy before it finalizes. Focus: RIA
            implementation NPRM open until Aug 31 2026.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link href="/nprm" className="btn btn-primary text-primary-content rounded-full px-6">
              Read NPRM explainer
            </Link>
            <Link href="/status" className="btn btn-outline rounded-full px-6">
              Status Update
            </Link>
            <Link href="/tracker" className="btn btn-outline rounded-full px-6">
              Case Tracker
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-4 md:-mt-6 relative z-10">
        <div
          className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 sm:px-5 sm:py-3.5 shadow-soft text-center sm:text-left"
          role="status"
        >
          <HomeDeadlineCountdown />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8 md:pt-16 md:pb-10">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
            What you can use today
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">Current tools</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {TOOLS.map((tool) => (
            <article
              key={tool.href}
              className={`home-tool-card home-tool-card--${tool.variant}`}
            >
              <p
                className={`text-[11px] uppercase tracking-wider font-bold mb-2 ${
                  tool.comingSoon
                    ? 'inline-flex self-start rounded-md border border-neutral-700/20 bg-white/70 px-2 py-0.5 text-neutral-700'
                    : tool.primary
                      ? 'text-secondary'
                      : 'text-neutral/70'
                }`}
              >
                {tool.badge}
              </p>
              <h3 className="text-xl font-bold text-primary">{tool.title}</h3>
              <p className="text-sm text-neutral/80 leading-relaxed mt-2 flex-1">
                {tool.body}
              </p>
              {tool.comingSoon ? (
                <CaseTrackerWaitlistForm
                  source="home"
                  variant="compact"
                  inputId="home-tracker-email"
                />
              ) : (
                <Link
                  href={tool.href}
                  className={`btn btn-sm rounded-full mt-5 self-start ${
                    tool.primary
                      ? 'btn-primary text-primary-content'
                      : 'btn-outline bg-white/60'
                  }`}
                >
                  {tool.cta}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-6 text-center">
        <p className="text-sm text-neutral/60 max-w-xl mx-auto leading-relaxed">
          Questions?{' '}
          <a href="mailto:hello@eb5base.com" className="link link-secondary font-medium">
            hello@eb5base.com
          </a>
          {' · '}
          <Link href="/about" className="link link-secondary font-medium">
            About EB5 Base
          </Link>
          {' · '}
          <Link href="/about#disclaimer" className="link link-secondary font-medium">
            Disclaimer
          </Link>
        </p>
      </section>
    </div>
  );
}
