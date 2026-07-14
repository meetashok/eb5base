import Link from 'next/link';
import { BrandWordmark } from '@/components/Logo';

const FEATURES = [
  {
    title: 'Track every application',
    body: 'Follow your EB-5 journey across I-526E, I-485, I-131, and I-765 — for you and your family — in one dashboard.',
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
  'No admin UI shows raw receipt numbers — only masked forms like IOE09326XXXXX.',
  'Row Level Security ensures you can only access your own data.',
  'Every decryption is written to an audit log.',
  'The codebase is open source so the community can verify these claims.',
  'You can delete your account at any time and permanently remove your data.',
];

export default function HomePage() {
  return (
    <div>
      <section className="hero-glow border-b border-base-300/80">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <p className="hero-eyebrow mb-3">EB-5 case status tracker</p>
          <h1 className="text-4xl md:text-5xl font-bold hero-headline tracking-tight text-balance max-w-3xl">
            Your immigration timeline, encrypted and up to date
          </h1>
          <p className="text-neutral/70 text-lg leading-relaxed mt-5 max-w-2xl">
            <BrandWordmark variant="on-light" className="font-semibold" /> helps EB-5 investors
            track USCIS case status, get notified on changes, and learn from anonymized community
            insights — without exposing receipt numbers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link href="/login" className="btn btn-primary rounded-full px-8">
              Login to get started
            </Link>
            <Link href="/about" className="btn btn-ghost rounded-full">
              About the project
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
          What the platform does
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8">Built for EB-5 investors</h2>
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
        <h2 className="text-2xl font-bold text-primary mb-3">Ready to track your cases?</h2>
        <p className="text-neutral/70 mb-6 max-w-xl mx-auto">
          Sign in with Google or a magic link. After a short setup, your timeline is ready.
        </p>
        <Link href="/login" className="btn btn-accent text-accent-content rounded-full px-8">
          Login
        </Link>
      </section>
    </div>
  );
}
