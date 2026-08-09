import Link from 'next/link';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'Case Tracker',
  description:
    'EB-5 case status tracker: follow USCIS updates for your petitions. Coming soon.',
};

const FEATURES = [
  {
    title: 'Track every application',
    body: 'Follow your EB-5 journey across I-526E, I-485, I-131, and I-765 for you and your family in one dashboard.',
  },
  {
    title: 'Email when status changes',
    body: 'Get an immediate alert or a daily digest when USCIS updates a case you are tracking.',
  },
  {
    title: 'Compare with your cohort',
    body: 'See anonymized insights for your project and filing quarter once enough investors are tracking.',
  },
];

const PRIVACY_POINTS = [
  'Receipt numbers are encrypted at rest with server-side AES-256-GCM. Plaintext is never stored in the database.',
  'Decryption happens only for automated USCIS polling and when you view your own cases while logged in.',
  'No admin UI shows raw receipt numbers, only masked forms like IOE09326XXXXX.',
  'Row Level Security ensures you can only access your own data.',
  'Every decryption is written to an audit log.',
  'You can delete your account at any time and permanently remove your data.',
];

export default function TrackerComingSoonPage() {
  return (
    <div>
      <section className="hero-glow border-b border-base-300/80">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="hero-eyebrow mb-0">EB-5 case status tracker</p>
            <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Coming soon
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold hero-headline tracking-tight text-balance max-w-3xl">
            Your immigration timeline, encrypted and up to date
          </h1>
          <p className="text-neutral/70 text-lg leading-relaxed mt-5 max-w-2xl">
            <BrandWordmark variant="on-light" className="font-semibold" /> helps EB-5 investors
            track USCIS case status, get notified on changes, and learn from anonymized community
            insights without exposing receipt numbers.
          </p>
          <div className="mt-8 rounded-xl border-2 border-amber-200 bg-amber-50/80 px-4 py-4 sm:px-5 max-w-2xl">
            <p className="text-sm font-bold text-amber-950">Coming soon</p>
            <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
              The tracker home page and product design are ready. Sign-in, case polling, and
              alerts are not live yet. Check back here, or follow the NPRM guide while we finish
              launch work.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="btn btn-sm btn-disabled rounded-full px-5 normal-case">
                Tracker not open yet
              </span>
              <Link href="/nprm" className="btn btn-sm btn-primary rounded-full px-5">
                Open NPRM guide
              </Link>
              <Link href="/about" className="btn btn-sm btn-ghost rounded-full">
                About EB5 Base
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
          What the platform will do
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8">
          Built for EB-5 investors
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-elevated">
              <div className="card-body gap-2">
                <h3 className="font-bold text-primary text-lg">{f.title}</h3>
                <p className="text-sm text-neutral/70 leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-warm border-y border-base-300/80">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
            Privacy &amp; security
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
            Receipt numbers stay protected
          </h2>
          <ul className="space-y-3 max-w-3xl">
            {PRIVACY_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-neutral/80 leading-relaxed">
                <span className="text-secondary font-bold mt-0.5">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="link link-secondary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="link link-secondary">
              Terms of Service
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-primary mb-3">Launching soon</h2>
        <p className="text-neutral/70 mb-6 max-w-xl mx-auto">
          When the tracker opens, you will sign in, add your cases, and get status updates from
          one place. Until then, this page is a preview only.
        </p>
        <Link href="/nprm" className="btn btn-accent text-accent-content rounded-full px-8">
          Use the NPRM guide for now
        </Link>
      </section>
    </div>
  );
}
