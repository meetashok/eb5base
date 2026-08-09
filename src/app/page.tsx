import Link from 'next/link';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'EB5 Base - Information for EB-5 investors',
  description:
    'Practical tools for EB-5 investors: status update builder, NPRM comment guide, and case tracker. Nothing here is legal or financial advice.',
};

const TOOLS = [
  {
    href: '/status',
    title: 'Status Update',
    body: 'Draft a structured EB-5 status update from your milestones, preview it live, and share it with your community.',
    cta: 'Open Status Update',
    comingSoon: false,
  },
  {
    href: '/nprm',
    title: 'NPRM Comment Guide',
    body: 'Plain-English explainer of the July 2026 EB-5 proposed rule, comment themes, and a prompt builder for regulations.gov.',
    cta: 'Open NPRM guide',
    comingSoon: false,
  },
  {
    href: '/tracker',
    title: 'Case Tracker',
    body: 'Track USCIS case status for your petitions, get notified on changes, and learn from anonymized cohort insights.',
    cta: 'Preview Case Tracker',
    comingSoon: true,
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
            <BrandWordmark variant="on-light" className="font-semibold" /> helps potential and
            existing investors make sense of EB-5 rules and case progress.
          </p>
          <p className="mt-3 text-sm font-medium text-amber-800 max-w-xl mx-auto leading-relaxed">
            Nothing here is legal or financial advice.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link href="/status" className="btn btn-outline rounded-full px-6">
              Status Update
            </Link>
            <Link href="/nprm" className="btn btn-outline rounded-full px-6">
              NPRM Comment Guide
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
              className="rounded-2xl border-2 border-base-300 bg-base-100 p-6 shadow-soft flex flex-col text-left"
            >
              <p
                className={`text-[11px] uppercase tracking-wider font-bold mb-2 ${
                  tool.comingSoon ? 'text-amber-800' : 'text-secondary'
                }`}
              >
                {tool.comingSoon ? 'Coming soon' : 'Available now'}
              </p>
              <h3 className="text-xl font-bold text-primary">{tool.title}</h3>
              <p className="text-sm text-neutral/75 leading-relaxed mt-2 flex-1">{tool.body}</p>
              <Link
                href={tool.href}
                className="btn btn-sm btn-outline rounded-full mt-5 self-start"
              >
                {tool.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 text-center">
        <p className="text-sm text-neutral/60 max-w-xl mx-auto leading-relaxed">
          Questions or feedback?{' '}
          <a href="mailto:hello@eb5base.com" className="link link-secondary font-medium">
            hello@eb5base.com
          </a>
          {' · '}
          <Link href="/about" className="link link-secondary font-medium">
            About EB5 Base
          </Link>
        </p>
      </section>
    </div>
  );
}
