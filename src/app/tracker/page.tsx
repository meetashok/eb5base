import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'Case Tracker',
  description:
    'EB-5 Case Tracker: follow USCIS updates for your petitions. Coming soon. Receipt numbers stay private from other investors and from EB5 Base staff views.',
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

export default function TrackerComingSoonPage() {
  return (
    <div>
      <PageHero
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>Case Tracker</span>
            <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 normal-case">
              Coming soon
            </span>
          </span>
        }
        title="Your immigration timeline, encrypted and up to date"
        subtitle={
          <p>
            <BrandWordmark variant="on-light" className="font-semibold" /> helps EB-5 investors
            track USCIS case status, get notified on changes, and learn from anonymized community
            insights without exposing receipt numbers to other investors or on EB5 Base.
          </p>
        }
      />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <section className="rounded-2xl border-2 border-amber-200/80 bg-amber-50/70 p-6 md:p-8 space-y-4 shadow-soft">
          <p className="text-xs uppercase tracking-[0.22em] font-semibold text-amber-900">
            Status
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-primary">Coming soon</h2>
          <p className="text-sm text-neutral/80 leading-relaxed">
            The Case Tracker product design is ready. Sign-in, case polling, and alerts are not
            live yet. Check back here, or use the NPRM guide while we finish launch work.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="btn btn-sm btn-disabled rounded-full px-5 normal-case">
              Case Tracker not open yet
            </span>
            <Link href="/nprm" className="btn btn-sm btn-primary rounded-full px-5">
              Open NPRM guide
            </Link>
            <Link href="/about" className="btn btn-sm btn-ghost rounded-full">
              About EB5 Base
            </Link>
          </div>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
              What it will do
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-primary">
              Built for EB-5 investors
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2"
              >
                <h3 className="font-bold text-primary text-base">{f.title}</h3>
                <p className="text-sm text-neutral/75 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-elevated p-6 md:p-8 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
              Privacy &amp; security
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-primary">
              Receipt numbers stay protected
            </h2>
            <p className="text-sm text-neutral/60 mt-2 leading-relaxed max-w-2xl">
              Designed so your receipt numbers are not shown to other investors or to EB5 Base
              staff in clear text.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-neutral/80">
            {PRIVACY_POINTS.map((point) => (
              <CheckItem key={point}>{point}</CheckItem>
            ))}
          </ul>
          <p className="text-sm text-neutral/80 pt-2">
            Read our{' '}
            <Link href="/privacy" className="link link-secondary">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="link link-secondary">
              Terms of Service
            </Link>
            .
          </p>
        </section>

        <section className="card-elevated p-6 md:p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-primary">Launching soon</h2>
          <p className="text-sm text-neutral/70 max-w-xl mx-auto leading-relaxed">
            When Case Tracker opens, you will sign in, add your cases, and get status updates
            from one place. Until then, this page is a preview only.
          </p>
          <Link href="/nprm" className="btn btn-accent text-accent-content rounded-full px-8 mt-2">
            Use the NPRM guide for now
          </Link>
        </section>
      </div>
    </div>
  );
}
