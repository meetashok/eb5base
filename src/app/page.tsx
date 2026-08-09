import Link from 'next/link';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'EB5 Base - Home',
  description:
    'Investor-built tools for EB-5: plain-English NPRM explainer (comments due Aug 31 2026), status update builder, and forthcoming case tracker. Nothing here is legal or financial advice.',
};

const TOOLS = [
  {
    href: '/nprm',
    title: 'NPRM Comment Guide',
    body: 'Plain-English explainer of the July 2026 EB-5 proposed rule, impact matrix, themes, and comment builder — comments close Aug 31.',
    cta: 'Read explainer — 5 min',
    comingSoon: false,
    primary: true,
  },
  {
    href: '/status',
    title: 'Status Update',
    body: 'Draft a structured EB-5 status update from your milestones, preview it live, and share it with your community.',
    cta: 'Open Status Update',
    comingSoon: false,
    primary: false,
  },
  {
    href: '/tracker',
    title: 'Case Tracker',
    body: 'Track USCIS case status for your petitions, get notified on changes, and learn from anonymized cohort insights.',
    cta: 'Preview Case Tracker',
    comingSoon: true,
    primary: false,
  },
];

const FAQ = [
  {
    q: 'Is this legal advice?',
    a: 'No. EB5 Base is information only — not legal or financial advice, and not affiliated with USCIS or DHS. Verify on the Federal Register and consult an immigration attorney.',
  },
  {
    q: 'Who built this?',
    a: 'Investors in the EB-5 community. The tools are community-built and investor-led, with open feedback at hello@eb5base.com.',
  },
  {
    q: 'How do you make money?',
    a: 'We do not. No ads, no referral fees, no RC promotions. The goal is shared clarity on rules and case progress.',
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
          <p className="mt-3 text-sm font-semibold text-primary max-w-xl mx-auto">
            Built by investors, for investors. 0 ads, 0 referral fees.
          </p>
          <p className="mt-2 text-sm font-medium text-amber-800 max-w-xl mx-auto leading-relaxed">
            Nothing here is legal or financial advice.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link href="/nprm" className="btn btn-primary text-primary-content rounded-full px-6">
              Read NPRM explainer
            </Link>
            <Link href="/status" className="btn btn-outline rounded-full px-6">
              Status Update
            </Link>
            <span className="relative inline-flex">
              <Link href="/tracker" className="btn btn-outline rounded-full px-6">
                Case Tracker
              </Link>
              <span className="pointer-events-none absolute -top-2 -right-1 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900 leading-none shadow-sm">
                Soon
              </span>
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-4 md:-mt-6 relative z-10">
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 sm:px-5 sm:py-3.5 shadow-soft text-center sm:text-left">
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
            <span className="font-bold">Deadline alert:</span> EB-5 NPRM comments close{' '}
            <span className="font-semibold">Aug 31, 2026</span>
            <span className="text-amber-800/50 mx-1.5">·</span>
            Docket USCIS-2026-0100
            <span className="text-amber-800/50 mx-1.5">·</span>
            FR Doc 2026-13392
            <span className="text-amber-800/50 mx-1.5">·</span>
            Source: regulations.gov via api.data.gov
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
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
              className={`rounded-2xl border-2 bg-base-100 p-6 shadow-soft flex flex-col text-left ${
                tool.primary ? 'border-secondary/50 ring-1 ring-secondary/20' : 'border-base-300'
              }`}
            >
              <p
                className={`text-[11px] uppercase tracking-wider font-bold mb-2 ${
                  tool.comingSoon
                    ? 'text-amber-900'
                    : tool.primary
                      ? 'text-secondary'
                      : 'text-neutral/70'
                }`}
              >
                {tool.comingSoon
                  ? 'Coming soon'
                  : tool.primary
                    ? 'Urgent · Available now'
                    : 'Available now'}
              </p>
              <h3 className="text-xl font-bold text-primary">{tool.title}</h3>
              <p className="text-sm text-neutral/75 leading-relaxed mt-2 flex-1">{tool.body}</p>
              {tool.comingSoon ? (
                <a
                  href="mailto:hello@eb5base.com?subject=Case%20Tracker%20notify%20me"
                  className="btn btn-sm btn-outline rounded-full mt-5 self-start border-neutral/30"
                >
                  Notify me
                </a>
              ) : (
                <Link
                  href={tool.href}
                  className={`btn btn-sm rounded-full mt-5 self-start ${
                    tool.primary
                      ? 'btn-primary text-primary-content'
                      : 'btn-outline'
                  }`}
                >
                  {tool.cta}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12 space-y-4">
        <h2 className="text-xl font-bold text-primary text-center">FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="rounded-xl border-2 border-base-300 bg-base-100 p-4 shadow-sm"
            >
              <summary className="cursor-pointer font-semibold text-primary text-sm sm:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary rounded">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-neutral leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 text-center">
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
          <Link href="/disclaimer" className="link link-secondary font-medium">
            Disclaimer
          </Link>
        </p>
      </section>
    </div>
  );
}
